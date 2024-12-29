'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NoteEditorProps {
    noteUuid: string;
}

export default function NoteEditor({ noteUuid }: NoteEditorProps) {
    const [content, setContent] = useState('');
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
                setContent(noteContent);
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
        await window.electron.updateNote(noteUuid, newContent);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse bg-gray-200 w-full h-[70vh] rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-[70vh] p-4 bg-white rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Start typing your note..."
                />
            </div>
        </div>
    );
} 