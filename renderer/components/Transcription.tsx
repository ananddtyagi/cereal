import { useEffect, useRef, useState } from 'react';

interface TranscriptionProps {
    note_uuid: string;
}

export default function Transcription({
    note_uuid,
}: TranscriptionProps) {
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const accumulatedDataRef = useRef<Uint8Array>(new Uint8Array());
    const headerDataRef = useRef<Uint8Array | null>(null);
    const runningTranscriptionRef = useRef<string>('');
    const processingRef = useRef<boolean>(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        // Load initial transcription
        if (note_uuid) {
            window.electron.getTranscription(note_uuid).then(setCurrentTranscript);
        }
    }, [note_uuid]);

    const updateTranscription = async (text: string) => {
        try {
            await window.electron.addToTranscription(note_uuid, text);
            const transcript = await window.electron.getTranscription(note_uuid);
            setCurrentTranscript(transcript);
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

    return (
        <div className="space-y-4">
            {/* Active Transcription */}
            {isRecording && (
                <div className="p-4 bg-gray-50 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-sm text-gray-500">Recording...</div>
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                            <span className="text-sm text-gray-500">Live Transcript</span>
                        </div>
                    </div>
                    <div className="text-gray-800">
                        {currentTranscript || 'Listening...'}
                    </div>
                </div>
            )}

            <button
                onClick={() => setIsRecording(!isRecording)}
                title="Toggle recording"
                className={`fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all 
                    ${isRecording ? 'bg-red-500' : 'bg-blue-500'} 
                    hover:scale-110`}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                </svg>
            </button>
        </div>
    );
}