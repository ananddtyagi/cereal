export interface ElectronAPI {
    getAllNotes: () => Promise<Record<string, { title: string, content: string }>>;
    getNote: (uuid: string) => Promise<{ title: string, content: string } | null>;
    createNote: () => Promise<string>;
    updateNoteContent: (uuid: string, content: string) => Promise<boolean>;
    updateNoteTitle: (uuid: string, content: string) => Promise<boolean>;
    deleteNote: (uuid: string) => Promise<boolean>;
    transcribeAudio: (base64Audio: string) => Promise<string | null>;
    addToTranscription: (note_uuid: string, text: string, source: string) => Promise<string>;
    getTranscription: (note_uuid: string) => Promise<TranscriptionBlock[]>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 