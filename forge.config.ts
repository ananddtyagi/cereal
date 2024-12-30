const config = {
    packagerConfig: {
        asar: true,
        extraResource: [
<<<<<<<< HEAD:forge.config.ts
            'transcription-server'
========
            './transcription-server/whisper-server',
            './transcription-server/models'
>>>>>>>> 68778f8 (rudimentary realtime audio transcription):forge.config.js
        ],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {},
        },
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin'],
        },
        {
            name: '@electron-forge/maker-deb',
            config: {},
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {},
        },
    ],
};

module.exports = config;
