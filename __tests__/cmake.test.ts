import * as process from 'process';
import * as path from 'path';
import * as io from '@actions/io';
import { cmake } from '../src/cmake';
import { spawnSync as spawn } from 'child_process';

const tempDirectory = path.join(__dirname, 'temp-get-cmake');

jest.setTimeout(30 * 1000);

describe('get-cmake', () => {
    beforeEach(async () => {
        await io.rmRF(tempDirectory);
        await io.mkdirP(tempDirectory);
        Object.keys(process.env)
            .filter(key => key.match(/^INPUT_/))
            .forEach(key => {
                delete process.env[key];
            });
        process.env.INPUT_CMAKE = '3.17.2';
        process.env.GITHUB_WORKSPACE = tempDirectory;
        process.env.RUNNER_TEMP = path.join(tempDirectory, 'temp');
        process.env.RUNNER_TOOL_CACHE = path.join(
            tempDirectory,
            'tempToolCache'
        );
    });

    afterAll(async () => {
        try {
            await io.rmRF(tempDirectory);
        } catch {
            console.log('Failed to remove test directories');
        }
    }, 100000);

    it('should download CMake', async () => {
        const cmakePath = await cmake();
        expect(cmakePath).toBeDefined();
        expect(cmakePath).not.toHaveLength(0);

        const { status, error } = spawn(cmakePath, ['--version'], {
            encoding: 'utf8'
        });
        expect(error).toBeUndefined();
        expect(status).toBe(0);
    });
});
