/*
 * This file uses some code from <https://github.com/lukka/get-cmake>.
 *
 * Copyright (c) 2020 Alex Shaw.
 * Copyright (c) 2020 Luca Cappa.
 */
import * as tools from '@actions/tool-cache';
import * as core from '@actions/core';
import * as path from 'path';
import * as fs from 'fs';
import semverLte from 'semver/functions/lte';
import semverCoerce from 'semver/functions/coerce';

interface PackageInfo {
    url: string;
    binPath: string;
    extractFunction: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (url: string, outputPath: string): Promise<string>;
    };
    dropSuffix: string;
}

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

function getPlatformData(version: string, platform?: string): PackageInfo {
    const semVersion = semverCoerce(version) || version;
    const platformStr = platform || process.platform;
    const arch = core.getInput('architecture') || process.arch;
    switch (platformStr) {
        case 'win':
        case 'win32':
        case 'win64': {
            const isOld = semverLte(semVersion, 'v3.19.6');
            let osArchStr: string;
            if (['ia32', 'x86', 'i386', 'x32'].includes(arch)) {
                osArchStr = isOld ? 'win32-x86' : 'windows-i386';
            } else {
                osArchStr = isOld ? 'win64-x64' : 'windows-x86_64';
            }
            return {
                binPath: 'bin/',
                dropSuffix: '.zip',
                extractFunction: tools.extractZip,
                url: `https://github.com/Kitware/CMake/releases/download/v${version}/cmake-${version}-${osArchStr}.zip`
            };
        }
        case 'mac':
        case 'darwin': {
            const isOld = semverLte(semVersion, 'v3.19.1');
            const osArchStr = isOld ? 'Darwin-x86_64' : 'macos-universal';
            return {
                binPath: 'CMake.app/Contents/bin/',
                dropSuffix: '.tar.gz',
                extractFunction: tools.extractTar,
                url: `https://github.com/Kitware/CMake/releases/download/v${version}/cmake-${version}-${osArchStr}.tar.gz`
            };
        }
        case 'linux': {
            const isOld = semverLte(semVersion, 'v3.19.8');
            let osArchStr: string;
            if (['aarch64'].includes(arch)) {
                osArchStr = isOld ? 'Linux-aarch64' : 'linux-aarch64';
            } else {
                osArchStr = isOld ? 'Linux-x86_64' : 'linux-x86_64';
            }
            return {
                binPath: 'bin/',
                dropSuffix: '.tar.gz',
                extractFunction: tools.extractTar,
                url: `https://github.com/Kitware/CMake/releases/download/v${version}/cmake-${version}-${osArchStr}.tar.gz`
            };
        }
        default:
            throw new Error(`Unsupported platform '${platformStr}'`);
    }
}

export async function cmake(version: string): Promise<string> {
    const platform = core.getInput('platform');
    const data = getPlatformData(version, platform);

    // Get an unique output directory name from the URL.
    const key: string = hashCode(data.url);
    const cmakePath = getOutputPath(key);

    const { pathname } = new URL(data.url);
    const dirName = path.basename(pathname);
    const outputPath = path.join(
        cmakePath,
        dirName.replace(data.dropSuffix, ''),
        data.binPath
    );

    const cmakeDir = tools.find('cmake', version);
    if (cmakeDir) {
        core.addPath(cmakeDir);
        return path.join(cmakeDir, platform === 'win' ? 'cmake.exe' : 'cmake');
    }

    if (!fs.existsSync(cmakePath)) {
        await core.group('Download and extract CMake', async () => {
            const downloaded = await tools.downloadTool(data.url);
            await data.extractFunction(downloaded, cmakePath);
        });
    }

    try {
        core.startGroup(`Add CMake to PATH`);
        core.addPath(outputPath);
    } finally {
        core.endGroup();
    }

    await tools.cacheDir(cmakePath, 'cmake', version);

    return path.join(outputPath, platform === 'win' ? 'cmake.exe' : 'cmake');
}
