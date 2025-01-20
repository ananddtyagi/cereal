import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import isDev from 'electron-is-dev';
import { app } from 'electron';
import { EventEmitter } from 'events';

const transcriptionEmitter = new EventEmitter();
let serverProcess: ChildProcess | null = null;
let isServerRunning = false;

export async function startWhisperServer(): Promise<void> {
    if (isServerRunning) {
        return;
    }

    return new Promise((resolve, reject) => {
        const baseDir = isDev
            ? process.cwd()
            : process.resourcesPath;

        const serverPath = path.join(baseDir, 'transcription-server', 'whisper-stream');

        // Kill any existing server process
        if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
        }

        // Run whisper-stream with basic configuration
        serverProcess = spawn(
            serverPath,
            [
                '-m', path.join(baseDir, 'transcription-server', 'models', 'ggml-base.en.bin'),
                '-t', '8',
                '--step', '500',
                '--length', '10000',
            ],
            {
                cwd: path.join(baseDir, 'transcription-server'),
                stdio: ['pipe', 'pipe', 'pipe'] // Enable stdin for streaming
            }
        );

        let startupError = '';

        serverProcess.stdout?.on('data', (data) => {
            const rawText = data.toString().trim();
            // Emit the processed transcription
            transcriptionEmitter.emit('transcription-update', {
                text: rawText
            });
        });

        serverProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            if (!error.includes('input is too short')) {
                startupError += error;
            }
        });

        setTimeout(() => {
            if (serverProcess?.exitCode === null) {
                isServerRunning = true;
                resolve();
            } else {
                isServerRunning = false;
                reject(new Error(`Failed to start whisper stream: ${startupError}`));
            }
        }, 5000);

        serverProcess.on('error', (error) => {
            isServerRunning = false;
            reject(error);
        });

        serverProcess.on('close', (code) => {
            isServerRunning = false;
            if (code !== 0) {
                reject(new Error(`Stream process exited with code ${code}`));
            }
        });
    });
}

export function stopWhisperServer(): void {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
        isServerRunning = false;
    }
}

// We still keep this function since the C++ server expects audio input
export function writeToWhisperStream(audioData: Buffer): void {
    if (!isServerRunning) {
        startWhisperServer().catch(() => {
            isServerRunning = false;
        });
        return;
    }

    if (serverProcess && serverProcess.stdin) {
        serverProcess.stdin.write(audioData);
    }
}

export const getTranscriptionEmitter = () => transcriptionEmitter;

// Cleanup on app quit
app.on('before-quit', () => {
    stopWhisperServer();
});