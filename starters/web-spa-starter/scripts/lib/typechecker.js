const { spawn } = require('child_process');

// Current running TSC process
// We keep it here to be able to reset it
let currentTscProcess;

/**
 * Check Typescript files.
 * Current Typescript checker will be killed to avoid double outputs.
 * TS errors will be shown in console.
 */
exports.typecheck = async () => new Promise( (resolve, reject) =>
{
    // Kill current running typescript checker
    currentTscProcess && currentTscProcess.kill();

    // Check Typescript files with installed tsc
    currentTscProcess = spawn('./node_modules/typescript/bin/tsc', [ '--noEmit', '--pretty' ], {
        // FIXME - Maybe better for memory leaks ?
        //detached : true,
    });

    // When Typescript checker has done
    currentTscProcess.once('exit', (code) =>
    {
        // No errors
        if ( code === 0 )
            resolve();

        // Errors detected
        else
            reject({
                code,
                stdout: (process.stdout.read() || '').toString(),
                stderr: (process.stderr.read() || '').toString()
            });
    });
});
