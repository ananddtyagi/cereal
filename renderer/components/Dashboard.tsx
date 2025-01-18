'use client';

import { createNewNote } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();

    const handleCreateNewNote = async () => {
        try {
            const newNoteId = await createNewNote();
            router.push(`/notes/${newNoteId}`);
        } catch (error) {
            console.error('Error creating note:', error);
        }
    };

    return (
        <div>
            <div className="text-center space-y-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 p-12 rounded-2xl shadow-xl">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Welcome to Cereal!
                </h1>
                <p className="text-xl text-primary-700">
                    A real-time speech transcription and note-taking app.
                </p>
                <div className="flex justify-center gap-4">
                    <a
                        href="/notes"
                        className="px-6 py-3 text-lg font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        View Notes
                    </a>
                    <button
                        onClick={handleCreateNewNote}
                        className="px-6 py-3 text-lg font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        New Note
                    </button>
                </div>
            </div>
        </div>
    );
}