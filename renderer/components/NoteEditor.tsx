'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Transcription from './Transcription';

interface NoteEditorProps {
    noteUuid: string;
}

interface Note {
    title: string;
    content: string;
}

export default function NoteEditor({ noteUuid }: NoteEditorProps) {
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<string[]>([]);
>>>>>>> 928e5b3 (add basic transcribing)
    const [currentTranscript, setCurrentTranscript] = useState('');
    const router = useRouter();

    useEffect(() => {
        loadNote();
<<<<<<< HEAD
        // Load initial transcription
        if (noteUuid) {
            window.electron.getTranscription(noteUuid).then(setCurrentTranscript);
        }
=======
        checkApiKey();
>>>>>>> 928e5b3 (add basic transcribing)
    }, [noteUuid]);

    const checkApiKey = async () => {
        const key = await window.electron.getApiKey();
        setApiKey(key);
    };

    const loadNote = async () => {
        if (!noteUuid) {
            router.push('/notes');
            return;
        }

        setLoading(true);
        try {
            const noteContent = await window.electron.getNote(noteUuid);
            if (noteContent !== null) {
                try {
                    const parsedNote = JSON.parse(noteContent) as Note;
                    setTitle(parsedNote.title || '');
                    setContent(parsedNote.content || '');
                } catch {
                    // If it's an old note format, just set it as content
                    setContent(noteContent);
                }
            }
        } catch (error) {
            console.error('Error loading note:', error);
            router.push('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleContentChange = async (newContent: string) => {
        setContent(newContent);
        if (!noteUuid) return;
        const noteData = JSON.stringify({ title, content: newContent });
        await window.electron.updateNote(noteUuid, noteData);
    };

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        if (!noteUuid) return;
        const noteData = JSON.stringify({ title: newTitle, content });
        await window.electron.updateNote(noteUuid, noteData);
    };

<<<<<<< HEAD
    const handleTranscriptionUpdate = async () => {
        // Just update the display, actual saving is handled in Transcription component
        const transcript = await window.electron.getTranscription(noteUuid);
        setCurrentTranscript(transcript);
    };

    const toggleRecording = () => {
=======
    const handleTranscriptionUpdate = (transcribedText: string) => {
        setCurrentTranscript(prev => prev + (prev ? ' ' : '') + transcribedText);
    };

    const toggleRecording = () => {
        if (isRecording && currentTranscript.trim()) {
            // Save the current transcript when stopping
            setTranscripts(prev => [...prev, currentTranscript.trim()]);
            setCurrentTranscript('');
        }
>>>>>>> 928e5b3 (add basic transcribing)
        setIsRecording(!isRecording);
    };

    if (loading) {
        return (
            <div className={`min-h-screen bg-blue`} >
                <div className="max-w-4xl mx-auto p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-gray-200 rounded-lg"></div>
                        <div className="h-[70vh] bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue">
            <div className="max-w-4xl mx-auto p-8 space-y-6">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full text-4xl font-bold mb-4 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
                    placeholder="Untitled"
                />
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-[50vh] p-4 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400 resize-none"
                    placeholder="Start typing your note..."
                />

                {/* Transcripts Section */}
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
<<<<<<< HEAD
=======

                    {/* Previous Transcripts */}
                    {transcripts.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-sm text-gray-500 font-medium">Previous Transcripts</div>
                            {transcripts.map((transcript, index) => (
                                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                                    <div className="text-gray-800">{transcript}</div>
                                </div>
                            ))}
                        </div>
                    )}
>>>>>>> 928e5b3 (add basic transcribing)
                </div>

                <Transcription
                    isRecording={isRecording}
                    onTranscriptionUpdate={handleTranscriptionUpdate}
<<<<<<< HEAD
                    note_uuid={noteUuid}
=======
>>>>>>> 928e5b3 (add basic transcribing)
                />

                <button
                    onClick={toggleRecording}
<<<<<<< HEAD
                    title="Toggle recording"
                    className={`fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all 
                        ${isRecording ? 'bg-red-500' : 'bg-blue-500'} 
                        hover:scale-110`}
=======
                    disabled={!apiKey}
                    title={!apiKey ? "Please add a valid OpenAI API key in settings" : "Toggle recording"}
                    className={`fixed bottom-8 right-8 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all 
                        ${isRecording ? 'bg-red-500' : 'bg-blue-500'} 
                        ${!apiKey ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}`}
>>>>>>> 928e5b3 (add basic transcribing)
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
        </div>
    );
} 