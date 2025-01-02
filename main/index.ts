import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { startWhisperServer } from './startWhisperServer';
import ffmpeg from 'fluent-ffmpeg';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
const PORT = 3000;


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

// Transcription operations
ipcMain.handle('add-to-transcription', async (_, note_uuid: string, text: string) => {
    const transcriptions = store.get('transcriptions', {}) as Record<string, string>;
    // Append the new text to existing transcription or create new one
    transcriptions[note_uuid] = transcriptions[note_uuid]
        ? transcriptions[note_uuid] + ' ' + text
        : text;
    store.set('transcriptions', transcriptions);
    return transcriptions[note_uuid];
});

ipcMain.handle('get-transcription', async (_, note_uuid: string) => {
    const transcriptions = store.get('transcriptions', {}) as Record<string, string>;
    return transcriptions[note_uuid] || '';
});

// Handle audio transcription
ipcMain.handle('transcribe-audio', async (_event, base64Audio) => {
    let webmFile: string | null = null;
    let wavFile: string | null = null;

    try {
        // Create a recordings directory in the user data directory
        const recordingsDir = path.join(app.getPath('userData'), 'recordings');
        if (!fs.existsSync(recordingsDir)) {
            fs.mkdirSync(recordingsDir, { recursive: true });
        }
        webmFile = path.join(recordingsDir, `recording-${Date.now()}.webm`);
        wavFile = webmFile.replace('.webm', '.wav');

        // Convert base64 to webm file
        const buffer = Buffer.from(base64Audio, 'base64');
        console.log('Buffer length:', buffer.length);

        // Add debug logging
        console.log('Writing to file:', webmFile);
        fs.writeFileSync(webmFile, buffer);

        // Verify file was written
        const stats = fs.statSync(webmFile);
        console.log('File size:', stats.size, 'bytes');
        console.log('File exists:', fs.existsSync(webmFile));

        // Skip processing if file is too small (less than 1KB)
        if (stats.size < 1024 || buffer.length < 1024) {
            console.log('Audio file too short, skipping transcription');
            return '';
        }

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
        // Verify WAV file existence
        console.log('Checking WAV file existence:', fs.existsSync(wavFile));
        console.log('WAV file:', wavFile);

        // Create form data with the WAV file
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
    }
    // finally {
    //     // Clean up files in finally block to ensure they're always deleted
    //     try {
    //         if (webmFile && fs.existsSync(webmFile)) {
    //             fs.unlinkSync(webmFile);
    //             console.log('Cleaned up WebM file');
    //         }
    //         if (wavFile && fs.existsSync(wavFile)) {
    //             fs.unlinkSync(wavFile);
    //             console.log('Cleaned up WAV file');
    //         }
    //     } catch (cleanupError) {
    //         console.error('Error during file cleanup:', cleanupError);
    //     }
    // }
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

    // Always use localhost:3000, in both dev and prod
    const url = `http://localhost:${PORT}`;

    await mainWindow.loadURL(url);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(async () => {
    await startNextServer();
    await startWhisperServer();
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