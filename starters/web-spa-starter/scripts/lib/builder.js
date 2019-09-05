const Bundler = require('parcel-bundler');
const Logger = require('@parcel/logger');
const { typecheck } = require("./typechecker");

function checkTypescript ()
{
    return new Promise( resolve =>
    {
        Logger.progress(' Checking typescript ...');

        typecheck()
            .then(() =>
            {
                Logger.stopSpinner();
                Logger.clear();
                // TODO : Better line cleaning cause sometime we see old errors
                Logger.log(`👌  ${ Logger.chalk.green.bold('Typescript validated.') }` );
                resolve();
            })
            .catch( error =>
            {
                Logger.stopSpinner();
                Logger.clear();
                error.stdout && console.error( error.stdout );
                error.stderr && console.error( error.stderr );
                resolve();
            });
    })
}

exports.run = async function ( production, noCheck )
{
    const { config } = require('../../config');

    const options = {
        outDir : config.outDir,
        outFile : config.outFile,
        publicUrl : config.publicUrl,
        logLevel : config.logLevel,
        watch : !production,
        cache : true,
        cacheDir : '.cache',
        contentHash : false,
        minify : production,
        scopeHoist : production, // FIXME - Test it in dev with a certain flag ?
        target : 'browser',
        hmr : !production,
        sourceMaps : !production,
        detailedReport : production,
    };

    // Create Parcel bundler
    const bundler = new Bundler( config.entries, options );

    // Check before build on production
    if ( production && !noCheck )
        await checkTypescript();

    // When a bundle is created
    bundler.on('bundled', async ( bundle ) =>
    {
        // Check after build, only on dev mode
        if ( !production && !noCheck )
            await checkTypescript();
    });

    // Start bundler
    const bundle = await bundler.bundle();
};