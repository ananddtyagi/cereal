import { useEffect, useRef } from 'react';

interface TranscriptionProps {
    isRecording: boolean;
    onTranscriptionUpdate: (text: string) => void;
    note_uuid: string;
}

export default function Transcription({ isRecording, onTranscriptionUpdate, note_uuid }: TranscriptionProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const accumulatedDataRef = useRef<Uint8Array>(new Uint8Array());
    const headerDataRef = useRef<Uint8Array | null>(null);
    const runningTranscriptionRef = useRef<string>('');
    const processingRef = useRef<boolean>(false);

    const updateTranscription = async (text: string) => {
        try {
            await window.electron.addToTranscription(note_uuid, text);
            onTranscriptionUpdate(text);
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    };

    const concatenateUint8Arrays = (array1: Uint8Array, array2: Uint8Array): Uint8Array => {
        const result = new Uint8Array(array1.length + array2.length);
        result.set(array1, 0);
        result.set(array2, array1.length);
        return result;
    };

    const processAudioBuffer = async () => {
        if (accumulatedDataRef.current.length === 0 || processingRef.current) return;

        processingRef.current = true;
        try {
            const audioBlob = new Blob([accumulatedDataRef.current], {
                type: mediaRecorderRef.current?.mimeType || 'audio/webm'
            });
            console.log("Audio blob size:", audioBlob.size);

            const base64Audio = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (!reader.result) {
                        reject(new Error('Failed to read audio data'));
                        return;
                    }
                    const base64 = reader.result.toString().split(',')[1];
                    resolve(base64);
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(audioBlob);
            });

            console.log("Transcribing audio");
            const transcription = await window.electron.transcribeAudio(base64Audio);
            console.log('Transcription received:', transcription);

            if (transcription) {
                if (transcription === runningTranscriptionRef.current) {
                    console.log('Segment complete - resetting buffer');
                    if (headerDataRef.current) {
                        // Reset to header data only
                        accumulatedDataRef.current = new Uint8Array(headerDataRef.current);
                    } else {
                        accumulatedDataRef.current = new Uint8Array();
                    }
                    runningTranscriptionRef.current = '';
                } else {
                    runningTranscriptionRef.current = transcription;
                    console.log('Updating transcription on UI');
                    await updateTranscription(transcription);
                }
            }
        } catch (error) {
            console.error('Transcription error:', error);
        } finally {
            processingRef.current = false;
        }
    };

    useEffect(() => {
        let processingInterval: NodeJS.Timeout;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000
                    }
                });

                const supportedMimeTypes = MediaRecorder.isTypeSupported;
                const mimeType = ['audio/wav', 'audio/webm'].find(type => supportedMimeTypes(type)) || 'audio/webm';

                const mediaRecorder = new MediaRecorder(stream, { mimeType });
                mediaRecorderRef.current = mediaRecorder;
                accumulatedDataRef.current = new Uint8Array();
                headerDataRef.current = null;
                runningTranscriptionRef.current = '';
                processingRef.current = false;

                console.log('Recording started');

                // Flag for first chunk (contains header)
                let isFirstChunk = true;

                mediaRecorder.ondataavailable = async (event) => {
                    if (event.data.size > 0) {
                        const arrayBuffer = await event.data.arrayBuffer();
                        const newData = new Uint8Array(arrayBuffer);

                        if (isFirstChunk) {
                            // Store header data
                            headerDataRef.current = new Uint8Array(arrayBuffer);
                            isFirstChunk = false;
                            console.log('Stored header data, size:', headerDataRef.current.length);
                        }

                        console.log('New chunk size:', newData.length);
                        accumulatedDataRef.current = concatenateUint8Arrays(
                            accumulatedDataRef.current,
                            newData
                        );
                        console.log('Total accumulated size:', accumulatedDataRef.current.length);
                    }
                };

                mediaRecorder.start(1000);

                processingInterval = setInterval(() => {
                    if (accumulatedDataRef.current.length > 0 && !processingRef.current) {
                        processAudioBuffer();
                    }
                }, 1000);

            } catch (error) {
                console.error('Error starting recording:', error);
            }
        };

        const stopRecording = () => {
            console.log('Recording stopped');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            clearInterval(processingInterval);
            accumulatedDataRef.current = new Uint8Array();
            headerDataRef.current = null;
            runningTranscriptionRef.current = '';
            processingRef.current = false;
        };

        if (isRecording) {
            startRecording();
        } else {
            stopRecording();
        }

        return () => {
            stopRecording();
        };
    }, [isRecording]);

    return null;
}