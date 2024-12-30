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
    updateNote: async (uuid: string, content: string): Promise<boolean> => {
        return await ipcRenderer.invoke('update-note', uuid, content);
    },
    transcribeAudio: async (base64Audio: string) => {
        return await ipcRenderer.invoke('transcribe-audio', base64Audio);
    },
});
