export interface ElectronAPI {
    getApiKey: () => Promise<string | null>;
    setApiKey: (apiKey: string) => Promise<boolean>;
    getAllNotes: () => Promise<Record<string, string>>;
    getNote: (uuid: string) => Promise<string | null>;
    createNote: (content?: string) => Promise<string>;
    updateNote: (uuid: string, content: string) => Promise<boolean>;
    transcribeAudio: (base64Audio: string) => Promise<string | null>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 