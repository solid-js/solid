const { spawn } = require('child_process');
const Logger = require('@parcel/logger');

// Current running TSC process
// We keep it here to be able to reset it
let currentTscProcess;

async function checkTypescript ()
{
    return new Promise( resolve =>
    {
        Logger.clear();
        Logger.progress(' Checking typescript ...');

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
            {
                Logger.stopSpinner();
                Logger.log(`👌 ${ Logger.chalk.green.bold('Typescript validated.') }` );
            }

            // Errors detected
            else
            {
                Logger.stopSpinner();
                Logger.write(`❌ Typescript error :\n\r`);

                const stdout = (currentTscProcess.stdout.read() || '').toString();
                const stderr = (currentTscProcess.stderr.read() || '').toString();
                stdout && Logger.write(stdout);
                stderr && Logger.write(stderr);
            }

            resolve();
        });
    })
}


exports.connect = async function ( bundler )
{
    const isProduction = process.env.NODE_ENV === 'production';

    // Check before build on production
    if ( isProduction )
    {
        await checkTypescript();
        console.log('');
    }

    // When a bundle is created
    bundler.on('bundled', async ( bundle ) =>
    {
        // Check after build, only on dev mode
        if ( !isProduction )
            await checkTypescript();
        else
            console.log('');
    });
};