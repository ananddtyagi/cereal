const fs = require('fs-extra');
const path = require('path');

// Ensure transcription-server is copied to the correct location
const sourceDir = path.resolve(__dirname, '../transcription-server');
const targetDir = path.resolve(__dirname, '../build/transcription-server');

fs.ensureDirSync(targetDir);
fs.copySync(sourceDir, targetDir);