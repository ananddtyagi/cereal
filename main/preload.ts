import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // Note operations
    getAllNotes: async (): Promise<Record<string, string>> => {
        return await ipcRenderer.invoke('get-all-notes');
    },
    getNote: async (uuid: string): Promise<string | null> => {
        return await ipcRenderer.invoke('get-note', uuid);
    },
    createNote: async (content: string = ''): Promise<string> => {
        return await ipcRenderer.invoke('create-note', content);
    },
    deleteNote: async (uuid: string): Promise<boolean> => {
        return await ipcRenderer.invoke('delete-note', uuid);
    },
    updateNote: async (uuid: string, content: string): Promise<boolean> => {
        return await ipcRenderer.invoke('update-note', uuid, content);
    },
    addToTranscription: async (note_uuid: string, text: string): Promise<string> => {
        return await ipcRenderer.invoke('add-to-transcription', note_uuid, text);
    },
    getTranscription: async (note_uuid: string): Promise<string> => {
        return await ipcRenderer.invoke('get-transcription', note_uuid);
    },
    transcribeAudio: async (base64Audio: string) => {
        return await ipcRenderer.invoke('transcribe-audio', base64Audio);
    },
});
