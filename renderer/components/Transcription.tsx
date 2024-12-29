import { useEffect, useRef, useState } from 'react';

interface TranscriptionProps {
    isRecording: boolean;
    onTranscriptionUpdate: (text: string) => void;
<<<<<<< HEAD
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
=======
}

export default function Transcription({ isRecording, onTranscriptionUpdate }: TranscriptionProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
>>>>>>> 928e5b3 (add basic transcribing)

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const startRecording = async () => {
            try {
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 7776839 (fix issue with file being sent for transcription to openai)
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000
                    }
                });

<<<<<<< HEAD
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
=======
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
=======
                // Use webm format which is supported by Whisper
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'audio/webm'
                });
>>>>>>> 7776839 (fix issue with file being sent for transcription to openai)
                mediaRecorderRef.current = mediaRecorder;

                let chunks: Blob[] = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
<<<<<<< HEAD
                        setAudioChunks(prev => [...prev, event.data]);

                        // Convert the audio chunk to base64
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const base64Audio = (reader.result as string).split(',')[1];

                            try {
                                // Send to main process for Whisper transcription
                                const transcription = await window.electron.transcribeAudio(base64Audio);
                                if (transcription) {
                                    onTranscriptionUpdate(transcription);
>>>>>>> 928e5b3 (add basic transcribing)
                                }
                            } catch (error) {
                                console.error('Transcription error:', error);
                            }
                        };
<<<<<<< HEAD
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

=======
                        reader.readAsDataURL(event.data);
                    }
                };

                mediaRecorder.start(1000); // Capture in 3-second intervals
>>>>>>> 928e5b3 (add basic transcribing)
=======
                        chunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    // Create a single blob from all chunks
                    const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                    // Convert to base64
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64Audio = (reader.result as string).split(',')[1];
                        try {
                            const transcription = await window.electron.transcribeAudio(base64Audio);
                            if (transcription) {
                                onTranscriptionUpdate(transcription);
                            }
                        } catch (error) {
                            console.error('Transcription error:', error);
                        }
                    };
                    reader.readAsDataURL(audioBlob);
                    chunks = [];
                };

                mediaRecorder.start();

                // Stop recording after 5 seconds to get a complete chunk
                timeoutId = setTimeout(() => {
                    if (mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                    }
                }, 5000);

>>>>>>> 7776839 (fix issue with file being sent for transcription to openai)
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
