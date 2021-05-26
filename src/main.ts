import * as core from '@actions/core';
import { cmake } from './cmake';
import { ninja } from './ninja';

export async function main(): Promise<number> {
    try {
        const cmakeVersion = core.getInput('cmake', {
            required: true
        });
        if (cmakeVersion !== 'false') {
            await cmake(cmakeVersion);
        }
        const ninjaVersion = core.getInput('ninja', {
            required: true
        });
        if (ninjaVersion !== 'false') {
            await ninja(ninjaVersion);
        }
    } catch (err) {
        const errorAsString = (err ?? 'undefined error').toString();
        core.debug('Error: ' + errorAsString);
        core.error(errorAsString);
        core.setFailed('install-cmake failed');
        return 1;
    }

    core.info('install-cmake succeeded');
    return 0;
}

main()
    .then(ret => {
        process.exitCode = ret;
    })
    .catch(error => {
        console.error('main() failed!', error);
        process.exitCode = 1;
    });
