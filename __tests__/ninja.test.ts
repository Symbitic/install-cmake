import * as process from 'process';
import * as path from 'path';
import * as io from '@actions/io';
import { ninja } from '../src/ninja';
import { spawnSync as spawn } from 'child_process';

const tempDirectory = path.join(__dirname, 'temp-get-ninja');

jest.setTimeout(30 * 1000);

describe('get-ninja', () => {
    beforeEach(async () => {
        await io.rmRF(tempDirectory);
        await io.mkdirP(tempDirectory);
        Object.keys(process.env)
            .filter((key) => key.match(/^INPUT_/))
            .forEach((key) => {
                delete process.env[key];
            });
        process.env.INPUT_NINJA = '1.9.0';
        process.env.INPUT_PLATFORM = 'linux';
        process.env.INPUT_DESTINATION = tempDirectory;
        process.env.GITHUB_WORKSPACE = tempDirectory;
        process.env.RUNNER_TEMP = path.join(tempDirectory, 'temp');
        process.env.RUNNER_TOOL_CACHE = path.join(tempDirectory, 'tempToolCache');
    });

    afterAll(async () => {
        try {
            await io.rmRF(tempDirectory);
        } catch {
            console.error('Failed to remove test directories');
        }
    }, 100000);

    it('should fetch Ninja 1.9.0', async () => {
        const ninjaPath = await ninja();
        expect(ninjaPath).toBeDefined();
        expect(ninjaPath).not.toHaveLength(0);

        const { status } = spawn(ninjaPath, [ '--version' ], { encoding: 'utf8' });
        expect(status).toBe(0);
    });
});
