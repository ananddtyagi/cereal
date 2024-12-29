const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getApiKey: async () => {
        console.log('Preload: Getting API key');
        const result = await ipcRenderer.invoke('get-api-key');
        console.log('Preload: Got API key:', result);
        return result;
    },
    setApiKey: async (apiKey) => {
        console.log('Preload: Setting API key:', apiKey);
        const result = await ipcRenderer.invoke('set-api-key', apiKey);
        console.log('Preload: Set API key result:', result);
        return result;
    },
}); 