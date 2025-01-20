import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { startWhisperServer, stopWhisperServer, writeToWhisperStream, getTranscriptionEmitter } from './startWhisperServer';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import EventEmitter from 'events';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
const PORT = 3000;

interface TranscriptionBlock { // Figure out how to create shared types between this and the renderer
    text: string;
    index: number;
    source: string;
}

let transcriptionEmitter: EventEmitter;

// Note operations
ipcMain.handle('get-all-notes', () => {
    return store.get('notes', {}) as Record<string, { title: string, content: string }>;
});

ipcMain.handle('get-note', (_, uuid: string) => {
    const notes = store.get('notes', {}) as Record<string, { title: string, content: string }>;
    return notes[uuid] || null;
});

ipcMain.handle('create-note', () => {
    const uuid = uuidv4();
    const notes = store.get('notes', {}) as Record<string, { title: string, content: string }>;
    notes[uuid] = { title: '', content: '' };
    store.set('notes', notes);
    return uuid;
});

ipcMain.handle('delete-note', (_, uuid: string) => {
    const notes = store.get('notes', {}) as Record<string, string>;
    if (!(uuid in notes)) return false;
    delete notes[uuid];
    store.set('notes', notes);
    return true;
});

ipcMain.handle('update-note-content', (_, uuid: string, content: string) => {
    const notes = store.get('notes', {}) as Record<string, { title: string, content: string }>;
    if (!(uuid in notes)) return false;
    notes[uuid].content = content;
    store.set('notes', notes);
    return true;
});

ipcMain.handle('update-note-title', (_, uuid: string, content: string) => {
    const notes = store.get('notes', {}) as Record<string, { title: string, content: string }>;
    if (!(uuid in notes)) return false;
    notes[uuid].title = content;
    store.set('notes', notes);
    return true;
});

// Transcription operations
ipcMain.handle('add-to-transcription', async (_, note_uuid: string, text: string, source: string) => {
    // Get existing transcriptions or initialize empty object if it doesn't exist
    const transcriptions = store.get('transcriptions', {}) as Record<string, TranscriptionBlock[]>;

    // Initialize array for this note if it doesn't exist
    if (!transcriptions[note_uuid]) {
        transcriptions[note_uuid] = [];
    }

    // Get the next index
    const nextIndex = transcriptions[note_uuid].length;

    // Add new block
    transcriptions[note_uuid].push({
        text,
        index: nextIndex,
        source: source
    });

    // Save back to store
    store.set('transcriptions', transcriptions);
    return transcriptions[note_uuid];
});

ipcMain.handle('get-transcription', async (_, note_uuid: string) => {
    const transcriptions = store.get('transcriptions', {}) as Record<string, TranscriptionBlock[]>;
    const blocks = transcriptions[note_uuid] || [];
    return blocks;
});

// Transcription state management
let currentTranscriptionBuffer = '';

// Handle audio transcription
ipcMain.handle('transcribe-audio', async (_event, audioData: string) => {
    try {
        // Convert base64 to buffer
        const buffer = Buffer.from(audioData, 'base64');

        // Skip if audio data is too small
        if (buffer.length < 1024) {
            return '';
        }

        // Write directly to whisper stream
        writeToWhisperStream(buffer);
        return '';
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
});

ipcMain.handle('start-recording', async () => {
    await startWhisperServer();
});

ipcMain.handle('stop-recording', () => {
    stopWhisperServer();
});

async function startNextServer() {
    if (!isDev) {
        const nextApp = next({
            dev: false,
            dir: path.join(__dirname, '../../renderer')
        });
        const handle = nextApp.getRequestHandler();

        await nextApp.prepare();
        createServer((req, res) => {
            const parsedUrl = parse(req.url!, true);
            handle(req, res, parsedUrl);
        }).listen(PORT);
    }
}

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Set up transcription event handling
    transcriptionEmitter = getTranscriptionEmitter();
    setupTranscriptionEmitter();
    // Always use localhost:3000, in both dev and prod
    const url = `http://localhost:${PORT}`;

    await mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}


const setupTranscriptionEmitter = () => {
    transcriptionEmitter.on('transcription-update', ({ text }) => {
        if (!mainWindow) return;

        // Send the processed transcription to the renderer
        mainWindow.webContents.send('transcription-update', {
            text
        });
    });
}

app.whenReady().then(async () => {
    await startNextServer();
    await createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});