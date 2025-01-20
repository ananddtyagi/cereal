import { contextBridge, ipcRenderer } from 'electron';

interface TranscriptionUpdate {
    text: string;
}

contextBridge.exposeInMainWorld('electron', {
    // Note operations
    getAllNotes: () => ipcRenderer.invoke('get-all-notes'),
    getNote: (uuid: string) => ipcRenderer.invoke('get-note', uuid),
    createNote: () => ipcRenderer.invoke('create-note'),
    deleteNote: (uuid: string) => ipcRenderer.invoke('delete-note', uuid),
    updateNoteContent: (uuid: string, content: string) => ipcRenderer.invoke('update-note-content', uuid, content),
    updateNoteTitle: (uuid: string, content: string) => ipcRenderer.invoke('update-note-title', uuid, content),

    // Transcription operations
    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    getTranscription: (note_uuid: string) => ipcRenderer.invoke('get-transcription', note_uuid),
    addToTranscription: (note_uuid: string, text: string, source: string) =>
        ipcRenderer.invoke('add-to-transcription', note_uuid, text, source),

    // Transcription events
    onTranscriptionUpdate: (callback: (transcription: TranscriptionUpdate) => void) => {
        const subscription = (_event: any, transcription: TranscriptionUpdate) => callback(transcription);
        ipcRenderer.on('transcription-update', subscription);
        return () => ipcRenderer.removeListener('transcription-update', subscription);
    },
});