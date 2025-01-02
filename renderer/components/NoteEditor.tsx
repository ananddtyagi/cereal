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

                <Transcription
                    note_uuid={noteUuid}
                />
            </div>
        </div>
    );
} 