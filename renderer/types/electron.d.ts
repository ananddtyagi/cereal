export interface ElectronAPI {
    getApiKey: () => Promise<string | null>;
    setApiKey: (apiKey: string) => Promise<boolean>;
}

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export { }; 