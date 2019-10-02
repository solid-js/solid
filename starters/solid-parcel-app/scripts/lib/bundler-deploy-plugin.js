/**
 * FORKED FROM https://github.com/elwin013/parcel-plugin-static-files-copy
 */

const {M, F} = require('@solid-js/files');

const Logger = require('@parcel/logger');


const copy = function ()
{

};

exports.connect = function ( bundler, files, properties )
{
    const outDir = bundler.options.outDir;



    bundler.on('bundled', async bundle =>
    {
        const mainAsset = (
            bundler.mainAsset ||                                                // parcel < 1.8
            bundler.mainBundle.entryAsset ||                                    // parcel >= 1.8 single entry point
            bundler.mainBundle.childBundles.values().next().value.entryAsset
        );

        const promises = Object.keys( files ).map( async filePath =>
        {
            const fileConfig = files[ filePath ];
            const type = typeof fileConfig;

            if ( type === 'boolean' )
            {
                if ( fileConfig === true )
                    await F( filePath ).copy( outDir );
            }
            else if ( type === 'string' )
            {
                fileConfig.toLowerCase() === 'copy'
                ? await F( filePath ).copy( outDir )
                : await F( filePath ).copy( fileConfig );
            }
            else if ( type === 'object' )
            {
                // TODO : TEMPLATE, trouver sytaxe
            }
            else if ( type === 'function' )
            {
                fileConfig( filePath );
            }
        });

        // TODO
        //bundler.watch();

        await Promise.all( promises );
    });
};