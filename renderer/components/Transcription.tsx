import { useEffect, useRef, useState } from 'react';

interface TranscriptionProps {
    isRecording: boolean;
    onTranscriptionUpdate: (text: string) => void;
    note_uuid: string;
}

export default function Transcription({ isRecording, onTranscriptionUpdate, note_uuid }: TranscriptionProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [_, setAudioChunks] = useState<Blob[]>([]);

    const updateTranscription = async (text: string) => {
        try {
            await window.electron.addToTranscription(note_uuid, text);
            onTranscriptionUpdate(text);
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000
                    }
                });

                // Check supported MIME types
                const supportedMimeTypes = MediaRecorder.isTypeSupported;
                const mimeType = ['audio/wav', 'audio/webm'].find(type => supportedMimeTypes(type)) || 'audio/webm';

                // Use the supported format
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType
                });
                mediaRecorderRef.current = mediaRecorder;

                let chunks: Blob[] = [];
                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0) {
                        const audioBlob = event.data;
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const base64Audio = (reader.result as string).split(',')[1];
                            try {
                                const partialTranscription = await window.electron.transcribeAudio(base64Audio);
                                if (partialTranscription) {
                                    updateTranscription(partialTranscription);
                                }
                            } catch (error) {
                                console.error('Transcription error:', error);
                            }
                        };
                        reader.readAsDataURL(audioBlob);
                    }
                };

                mediaRecorder.onstop = async () => {
                    // Create a single blob from all chunks
                    const audioBlob = new Blob(chunks, { type: mimeType });

                    // Convert to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        try {
                            const transcription = await window.electron.transcribeAudio(base64Audio);
                            if (transcription) {
                                updateTranscription(transcription);
                            }
                        } catch (error) {
                            console.error('Transcription error:', error);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    chunks = [];
                };

                mediaRecorder.start();

                timeoutId = setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, 4000);

            } catch (error) {
                console.error('Error starting recording:', error);
            }
        };

        const stopRecording = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            setAudioChunks([]);
        };

        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }

        return () => {
            clearTimeout(timeoutId);
            stopRecording();
        };
    }, [isRecording, onTranscriptionUpdate]);

    return null; // This component doesn't render anything
}