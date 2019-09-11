const Bundler = require('parcel-bundler');
const Logger = require('@parcel/logger');
const { M } = require('@solid-js/files');
const Structurize = require('parcel-plugin-structurize');

// https://github.com/parcel-bundler/awesome-parcel#plugins

exports.run = async function ( noCheck )
{
    const isProduction = process.env.NODE_ENV === 'production';
    const { config } = require('../../config');

    const options = {
        outDir : './dist',
        //outFile : 'index.html',
        publicUrl : config.publicUrl,
        logLevel : config.logLevel,
        cache : true,
        cacheDir : '.cache',
        contentHash : isProduction,
        minify : isProduction,
        scopeHoist : isProduction, // FIXME - Test it in dev with a certain flag ?
        target : 'browser',
        watch : !isProduction,
        hmr : !isProduction,
        sourceMaps : !isProduction,
        detailedReport : isProduction,
    };

    // Get html entries
    const entries = await M( 'src/*.html' ).paths();

    // Create Parcel bundler
    const bundler = new Bundler( entries, options );

    // Create manifest file
    require('./bundler-manifest-plugin').connect( bundler );

    // Check typescript if not disabled
    if (!noCheck) await require('./bundler-typescript-checker-plugin').connect( bundler );

    // Start bundler
    const bundle = await bundler.bundle();
};