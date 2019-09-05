const Bundler = require('parcel-bundler');
const Logger = require('@parcel/logger');
const { typecheck } = require("./typechecker");
const { M } = require('@solid-js/files');

function checkTypescript ()
{
    return new Promise( resolve =>
    {
        Logger.clear();
        Logger.progress('  Checking typescript ...');

        typecheck()
            .then(() =>
            {
                Logger.stopSpinner();
                Logger.log(`👌  ${ Logger.chalk.green.bold('Typescript validated.') }` );
                resolve();
            })
            .catch( error =>
            {
                Logger.stopSpinner();
                Logger.write(`❌  Typescript error :\n\r`)
                error.stdout && Logger.write(error.stdout);
                error.stderr && Logger.write(error.stderr);
                resolve();
            });
    })
}

exports.run = async function ( production, noCheck )
{
    const { config } = require('../../config');

    const options = {
        outDir : './dist',
        //outFile : 'index.html',
        publicUrl : config.publicUrl,
        logLevel : config.logLevel,
        watch : !production,
        cache : true,
        cacheDir : '.cache',
        //contentHash : false,
        minify : production,
        scopeHoist : production, // FIXME - Test it in dev with a certain flag ?
        target : 'browser',
        hmr : !production,
        sourceMaps : !production,
        detailedReport : production,
    };

    const entries = await M( 'src/*.html' ).paths();

    // Create Parcel bundler
    const bundler = new Bundler( entries, options );

    require('./bundler-manifest-plugin')( bundler );

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