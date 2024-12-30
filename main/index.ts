import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { startWhisperServer } from './startWhisperServer';
import ffmpeg from 'fluent-ffmpeg';

const store = new Store();
let serverPort = 9000; // Default port

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
    let webmFile: string | null = null;
    let wavFile: string | null = null;

    try {
        // Create a recordings directory if it doesn't exist
        const recordingsDir = path.join(__dirname, '..', 'recordings');
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }
        webmFile = path.join(recordingsDir, `recording-${Date.now()}.webm`);
        wavFile = webmFile.replace('.webm', '.wav');

        // Convert base64 to webm file
        const buffer = Buffer.from(base64Audio, 'base64');
        console.log('Buffer length:', buffer.length);
        fs.writeFileSync(webmFile, buffer);

        // Convert WebM to WAV using ffmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(webmFile!)
                .toFormat('wav')
                .outputOptions('-acodec pcm_s16le')  // 16-bit PCM encoding
                .outputOptions('-ar 16000')          // 16kHz sample rate
                .outputOptions('-ac 1')              // mono audio
                .on('end', resolve)
                .on('error', reject)
                .save(wavFile!);
        });

        // Create form data with the WAV file
        console.log('WAV file:', wavFile);
        const form = new FormData();
        form.append('file', wavFile);
        form.append('temperature', '0.0');
        form.append('temperature_inc', '0.2');
        form.append('response_format', 'json');

        console.log('Sending transcription request to whisper server...');
        const response = await fetch('http://127.0.0.1:9000/inference', {
            method: 'POST',
            body: form,
            headers: form.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // Parse the JSON response
        const result = await response.json();
        console.log('Transcription result:', result);

        // Return the transcribed text
        return result.text || '';
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    } finally {
        // Clean up files in finally block to ensure they're always deleted
        try {
            if (webmFile && fs.existsSync(webmFile)) {
                fs.unlinkSync(webmFile);
                console.log('Cleaned up WebM file');
            }
            if (wavFile && fs.existsSync(wavFile)) {
                fs.unlinkSync(wavFile);
                console.log('Cleaned up WAV file');
            }
        } catch (cleanupError) {
            console.error('Error during file cleanup:', cleanupError);
        }
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
app.whenReady().then(async () => {
    try {
        console.log('Starting whisper server...');
        await startWhisperServer();
        await createWindow();
    } catch (error) {
        console.error('Failed to start whisper server:', error);
        app.quit();
    }
});

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
