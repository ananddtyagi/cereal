import { useEffect, useRef, useState } from 'react';

interface TranscriptionProps {
    isRecording: boolean;
    onTranscriptionUpdate: (text: string) => void;
}

export default function Transcription({ isRecording, onTranscriptionUpdate }: TranscriptionProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0) {
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
                                }
                            } catch (error) {
                                console.error('Transcription error:', error);
                            }
                        };
                        reader.readAsDataURL(event.data);
                    }
                };

                mediaRecorder.start(1000); // Capture in 3-second intervals
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
