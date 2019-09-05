const Bundler = require('parcel-bundler');
const Logger = require('@parcel/logger');
const { M } = require('@solid-js/files');


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

    require('./bundler-manifest-plugin').connect( bundler );
    require('./bundler-renamer-plugin').connect( bundler );

    if (!noCheck)
        await require('./bundler-typescript-checker-plugin').connect( bundler, production );

    // Start bundler
    const bundle = await bundler.bundle();
};