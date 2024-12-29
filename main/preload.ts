import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    getApiKey: async (): Promise<string | null> => {
        console.log('Preload: Getting API key');
        const result = await ipcRenderer.invoke('get-api-key');
        console.log('Preload: Got API key:', result);
        return result;
    },
    setApiKey: async (apiKey: string): Promise<boolean> => {
        console.log('Preload: Setting API key:', apiKey);
        const result = await ipcRenderer.invoke('set-api-key', apiKey);
        console.log('Preload: Set API key result:', result);
        return result;
    },
});
