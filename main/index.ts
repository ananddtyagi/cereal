import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import { OpenAI } from 'openai';
import fs from 'fs';
import os from 'os';

const store = new Store();

// Keep a global reference of the window object to avoid garbage collection
let mainWindow: BrowserWindow | null = null;

// Set up IPC handlers
ipcMain.handle('get-api-key', () => {
    const key = store.get('apiKey');
    console.log('Getting API key:', key);
    return key;
});

ipcMain.handle('set-api-key', (_, apiKey: string) => {
    console.log('Setting API key:', apiKey);
    store.set('apiKey', apiKey);
    return true;
});

// Note operations
ipcMain.handle('get-all-notes', () => {
    return store.get('notes', {});
});

ipcMain.handle('get-note', (_, uuid: string) => {
    const notes = store.get('notes', {}) as Record<string, string>;
    return notes[uuid] || null;
});

ipcMain.handle('create-note', (_, content: string) => {
    const uuid = uuidv4();
    const notes = store.get('notes', {}) as Record<string, string>;
    notes[uuid] = content;
    store.set('notes', notes);
    return uuid;
});

ipcMain.handle('update-note', (_, uuid: string, content: string) => {
    const notes = store.get('notes', {}) as Record<string, string>;
    if (!(uuid in notes)) return false;
    notes[uuid] = content;
    store.set('notes', notes);
    return true;
});

// Handle audio transcription
ipcMain.handle('transcribe-audio', async (_event, base64Audio) => {
    const apiKey = store.get('apiKey');
    if (!apiKey) {
        return null;
    }

    try {
        // Create a temporary file to store the audio
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `recording-${Date.now()}.webm`);

        // Convert base64 to file
        const buffer = Buffer.from(base64Audio, 'base64');
        fs.writeFileSync(tempFile, buffer);

        // Create a readable stream from the temp file
        const audioFile = fs.createReadStream(tempFile);

        // Initialize OpenAI with the stored API key
        const openai = new OpenAI({
            apiKey: apiKey as string
        });

        // Call Whisper API
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            response_format: 'text'
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);

        return transcription;
    } catch (error) {
        console.error('Transcription error:', error);
        throw error; // Propagate the error to the renderer
    }
});

async function createWindow() {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log('Loading preload script from:', preloadPath);
    console.log('Current directory:', __dirname);
    console.log('Does preload exist?', require('fs').existsSync(preloadPath));

    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: preloadPath
        }
    });

    // Load the Next.js app
    const url = isDev
        ? 'http://localhost:3000' // Development URL
        : `file://${path.join(__dirname, '../renderer/out/index.html')}`; // Production URL

    mainWindow.loadURL(url);

    // Open the DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create window when app is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
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
