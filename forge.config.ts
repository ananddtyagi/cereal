import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path';

const config: ForgeConfig = {
    packagerConfig: {
        asar: true,
        extraResource: [
            'transcription-server'
        ],
        files: [
            "dist/**/*",
            "renderer/out/**/*",
            "transcription-server/**/*",
            "package.json"
        ]
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

export default config;