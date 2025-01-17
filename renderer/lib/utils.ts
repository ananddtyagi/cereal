import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export async function createNewNote() {
    try {
        const newNoteId = await window.electron.createNote('');
        return newNoteId;
    } catch (error) {
        console.error('Error creating note:', error);
        throw error;
    }
}
