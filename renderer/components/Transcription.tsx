import { act, useEffect, useRef, useState } from 'react';
import { TranscriptionBlock } from '../types/transcription';
import { TranscriptionUpdate } from '../types/electron';

interface TranscriptionProps {
    note_uuid: string;
}

export default function Transcription({ note_uuid }: TranscriptionProps) {
    // Replace state with refs and add display state
    const currentTranscriptRef = useRef('');
    const [activeTranscript, setActiveTranscript] = useState('');
    const activeTranscriptRef = useRef('');
    const [isRecording, setIsRecording] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [userHasScrolled, setUserHasScrolled] = useState(false);
    const [completedTranscripts, setCompletedTranscripts] = useState<TranscriptionBlock[]>([]);


    useEffect(() => {
        // Load initial transcription
        if (note_uuid) {
            window.electron.getTranscription(note_uuid).then((transcript: TranscriptionBlock[]) => {
                if (transcript) {
                    const blocks = transcript.map(({ text, index }: TranscriptionBlock) => ({
                        text,
                        index,
                        source: 'mic'
                    }));
                    if (blocks.length > 0) {
                        setCompletedTranscripts(blocks);
                    }
                }
            });
        }
    }, [note_uuid]);

    const updateTranscription = async (text: string) => {
        try {
            const updatedTranscripts = await window.electron.addToTranscription(note_uuid, text, 'mic');
            // Get the latest transcript from the response
            if (Array.isArray(updatedTranscripts) && updatedTranscripts.length > 0) {
                setCompletedTranscripts(updatedTranscripts);
            }
        } catch (error) {
            console.error('Error updating transcription:', error);
        }
    }

    const cleanTranscription = (text: string) => {
        // Clean up the text
        let cleanText = text
            .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')    // Remove ANSI escape sequences
            .replace(/\u001b\[2K/g, '')                  // Remove [2K specifically
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove all control characters
            .replace(/\r/g, '')                          // Remove carriage returns
            .replace(/\s+/g, ' ')                        // Normalize spaces
            .replace(/\([^)]*\)/g, '')                   // Remove text between parentheses
            .trim();


        return cleanText;
    };

    const processNewText = async (text: string) => {
        console.log("Processing new text", text)
        const cleanedText = cleanTranscription(text);
        if (cleanedText.includes("[Start speaking]")) {
            return;
        }
        if ((cleanedText === "" || cleanedText.trim().includes("[BLANK_AUDIO]")) && activeTranscriptRef.current.length > 0 && activeTranscriptRef.current !== completedTranscripts[completedTranscripts.length - 1].text) {
            await updateTranscription(activeTranscriptRef.current);
            activeTranscriptRef.current = "";
            setActiveTranscript("");
            return;
        }
        activeTranscriptRef.current = cleanedText;
        setActiveTranscript(cleanedText);
    }

    useEffect(() => {
        let cleanupListener: (() => void) | undefined;

        if (isRecording) {
            window.electron.startRecording();

            const handleTranscriptionUpdate = async (transcription: TranscriptionUpdate) => {
                const { text } = transcription;

                processNewText(text);
            };

            window.electron.onTranscriptionUpdate(handleTranscriptionUpdate);
            cleanupListener = () => {
                window.electron.onTranscriptionUpdate(() => { });
            };
        } else {
            window.electron.stopRecording();

            // // Save the final transcript
            // const finalText = [currentTranscriptRef.current, activeTranscript]
            //     .filter(Boolean)
            //     .join(' ');

            // if (finalText) {
            //     window.electron.addToTranscription(note_uuid, finalText, 'mic');
            // }

            // Reset all state
            currentTranscriptRef.current = '';
            setActiveTranscript('');

            if (cleanupListener) {
                cleanupListener();
            }
        }

        return () => {
            if (cleanupListener) {
                cleanupListener();
            }
            window.electron.stopRecording();
        };
    }, [isRecording, note_uuid]);

    // Auto-scroll function
    const scrollToBottom = () => {
        if (scrollContainerRef.current && !userHasScrolled) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    // Handle user scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 10;

        if (!isAtBottom) {
            setUserHasScrolled(true);
        } else {
            setUserHasScrolled(false);
        }
    };

    // Reset user scroll when recording starts
    useEffect(() => {
        if (isRecording) {
            setUserHasScrolled(false);
            scrollToBottom();
        }
    }, [isRecording]);

    // Auto-scroll when new transcripts arrive
    useEffect(() => {
        scrollToBottom();
    }, [currentTranscriptRef.current, activeTranscript]);

    return (
        <div className="relative h-full">
            {isRecording && (
                <div className="fixed bottom-24 right-8 w-1/2 bg-white rounded-lg border border-gray-200 shadow-lg max-h-[300px] overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium">Transcription</h3>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                                <span className="text-sm text-gray-500">Recording</span>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="p-4 overflow-y-auto max-h-[220px] space-y-2 scroll-smooth"
                    >
                        {/* Completed Transcripts */}
                        {completedTranscripts.map((block) => (
                            <div key={block.index} className="p-2 bg-gray-50 rounded border border-gray-100">
                                <div className="text-gray-800 text-sm">{block.text}</div>
                            </div>
                        ))}

                        {/* Active Transcription */}
                        {activeTranscript && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-100">
                                <div className="text-gray-800 text-sm">{activeTranscript}</div>
                            </div>
                        )}
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