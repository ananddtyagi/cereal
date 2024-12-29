export interface ElectronAPI {
    getAllNotes: () => Promise<Record<string, string>>;
    getNote: (uuid: string) => Promise<string | null>;
    createNote: (content?: string) => Promise<string>;
    updateNote: (uuid: string, content: string) => Promise<boolean>;
    transcribeAudio: (base64Audio: string) => Promise<string | null>;
<<<<<<< HEAD
    addToTranscription: (note_uuid: string, text: string) => Promise<string>;
    getTranscription: (note_uuid: string) => Promise<string>;
=======
>>>>>>> 7776839 (fix issue with file being sent for transcription to openai)
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 