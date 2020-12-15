/*
 * This file uses some code from <https://github.com/lukka/get-cmake>.
 *
 * Copyright (c) 2020 Alex Shaw.
 * Copyright (c) 2020 Luca Cappa.
 */
import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as tools from '@actions/tool-cache';

/**
 * Compute an unique number given some text.
 * @param {string} text
 * @returns {string}
 */
function hashCode(text: string): string {
    let hash = 42;
    if (text.length != 0) {
        for (let i = 0; i < text.length; i++) {
            const char: number = text.charCodeAt(i);
            hash = ((hash << 5) + hash) ^ char;
        }
    }

    return hash.toString();
}

function getOutputPath(subDir: string): string {
    if (!process.env.RUNNER_TEMP) {
        throw new Error(
            'Environment variable process.env.RUNNER_TEMP must be set, it is used as destination directory of the cache'
        );
    }
    return path.join(process.env.RUNNER_TEMP, subDir);
}

function getPlatform(platform?: string) {
    const platformStr = platform || process.platform;
    switch (platformStr) {
        case 'win':
        case 'win32':
        case 'win64':
            return 'win';
        case 'mac':
        case 'darwin':
            return 'mac';
        case 'linux':
            return 'linux';
        default:
            throw new Error(`Unsupported platform '${process.platform}'`);
    }
}

export async function ninja(): Promise<string> {
    const version = core.getInput('ninja', {
        required: true
    });

    const platform = getPlatform(core.getInput('platform'));

    const url = `https://github.com/ninja-build/ninja/releases/download/v${version}/ninja-${platform}.zip`;

    // Get an unique output directory name from the URL.
    const key: string = hashCode(url);
    const outputDir = getOutputPath(key);

    // Build artifact names.
    const ninjaBin = platform === 'win' ? 'ninja.exe' : 'ninja';
    const ninjaPath = path.join(outputDir, ninjaBin);

    // Restore from cache (if found).
    const ninjaDir = tools.find('ninja', version);
    if (ninjaDir) {
        core.addPath(ninjaDir);
        return path.join(ninjaDir, ninjaBin);
    }

    if (!fs.existsSync(outputDir)) {
        await core.group('Download and extract ninja-build', async () => {
            const downloaded = await tools.downloadTool(url);
            await tools.extractZip(downloaded, outputDir);
        });
    }

    try {
        core.startGroup('Add ninja-build to PATH');
        core.addPath(outputDir);
    } finally {
        core.endGroup();
    }

    await tools.cacheFile(ninjaPath, ninjaBin, 'ninja', version);

    return ninjaPath;
}
