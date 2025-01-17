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
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadNote();
    }, [noteUuid]);

    const loadNote = async () => {
        if (!noteUuid) {
            router.push('/notes');
            return;
        }

        setLoading(true);
        try {
            const note: { title: string, content: string } | null = await window.electron.getNote(noteUuid);
            if (note !== null) {
                setTitle(note.title || '');
                setContent(note.content || '');
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
        await window.electron.updateNoteContent(noteUuid, newContent);
    };

    const handleTitleChange = async (newTitle: string) => {
        setTitle(newTitle);
        if (!noteUuid) return;
        await window.electron.updateNoteTitle(noteUuid, newTitle);
    };

    const handleDelete = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this note? This action cannot be undone.');
        if (confirmed) {
            try {
                await window.electron.deleteNote(noteUuid);
                router.push('/notes');
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
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
                <div className="flex justify-between items-center">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full text-4xl font-bold mb-4 bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400"
                        placeholder="Untitled"
                    />
                    <button
                        onClick={handleDelete}
                        className="text-gray-500 hover:text-red-500 transition-colors p-2"
                        title="Delete note"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-[50vh] p-4 bg-transparent border-none rounded-lg focus:outline-none focus:ring-0 placeholder-gray-400 resize-none"
                    placeholder="Start typing your note..."
                />

                <Transcription
                    note_uuid={noteUuid}
                />
            </div>
        </div>
    );
} 