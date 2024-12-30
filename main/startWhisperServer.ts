import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import isDev from 'electron-is-dev';
import { app } from 'electron';

let serverProcess: ChildProcess | null = null;

export async function startWhisperServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        const baseDir = isDev
            ? process.cwd()
            : process.resourcesPath;

        const serverPath = path.join(baseDir, 'transcription-server', 'whisper-server');
        console.log(`Starting whisper-server from: ${serverPath}`);

        // Kill any existing server process
        if (serverProcess) {
            serverProcess.kill();
            serverProcess = null;
        }

        serverProcess = spawn(
            serverPath,
            ['--port', '9000'],
            {
                cwd: path.join(baseDir, 'transcription-server')
            }
        );

        let startupError = '';

        serverProcess.stdout?.on('data', (data) => {
            console.log(`whisper-server stdout: ${data.toString()}`);
        });

        serverProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            console.error(`whisper-server stderr: ${error}`);
            startupError += error;
        });

        // Give the server a few seconds to start
        setTimeout(() => {
            if (serverProcess?.exitCode === null) {
                console.log('Whisper server started successfully');
                resolve();
            } else {
                reject(new Error(`Failed to start whisper server: ${startupError}`));
            }
        }, 5000);

        serverProcess.on('error', (error) => {
            console.error('Server process error:', error);
            reject(error);
        });

        serverProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`whisper-server process exited with code ${code}`);
                console.error('Startup error:', startupError);
                reject(new Error(`Server process exited with code ${code}`));
            }
        });
    });
}

// Cleanup on app quit
app.on('before-quit', () => {
    if (serverProcess) {
        console.log('Shutting down whisper server...');
        serverProcess.kill();
        serverProcess = null;
    }
});

