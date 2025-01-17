'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createNewNote } from '@/lib/utils';

export default function NotesPage() {
    const [notes, setNotes] = useState<Record<string, { title: string, content: string }>>({});
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const allNotes = await window.electron.getAllNotes();
            setNotes(allNotes);
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNewNote = async () => {
        try {
            const newNoteId = await createNewNote();
            router.push(`/notes/${newNoteId}`);
        } catch (error) {
            console.error('Error creating note:', error);
        }
    };

    console.log(notes)
    return (
        <div className="p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-primary-800">My Notes</h1>
                    <button
                        onClick={handleCreateNewNote}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        New Note
                    </button>
                </div>
                <div className="grid gap-4">
                    {loading ? (
                        // Loading skeleton
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
                        ))
                    ) : Object.entries(notes).length === 0 ? (
                        // Empty state
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500">No notes yet. Create one to get started!</p>
                        </div>
                    ) : (
                        // Notes list
                        Object.entries(notes).map(([uuid, content]) => (
                            <Link
                                key={uuid}
                                href={`/notes/${uuid}`}
                                className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-xl font-semibold text-primary-800">
                                        {content.title || 'Untitled'}
                                        {/* {content.title || 'Untitled'} */}
                                    </h2>
                                    <p className="text-gray-600 line-clamp-2">
                                        {content.content || 'Empty note...'}
                                    </p>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
