export interface ElectronAPI {
    getAllNotes: () => Promise<Record<string, string>>;
    getNote: (uuid: string) => Promise<string | null>;
    createNote: (content?: string) => Promise<string>;
    updateNote: (uuid: string, content: string) => Promise<boolean>;
    transcribeAudio: (base64Audio: string) => Promise<string | null>;
    addToTranscription: (note_uuid: string, text: string, source: string) => Promise<string>;
    getTranscription: (note_uuid: string) => Promise<string>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 