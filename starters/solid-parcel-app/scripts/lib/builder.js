const Bundler = require('parcel-bundler');
const {halt} = require("@solid-js/cli");
const { M, F } = require('@solid-js/files');
const { config } = require('../../config');
const dotEnv = require('dotenv');
const chalk = require('chalk');

//const Logger = require('@parcel/logger');
//const Structurize = require('parcel-plugin-structurize');

// https://github.com/parcel-bundler/awesome-parcel#plugins

exports.run = async function ( noCheck )
{
    // Get production mode from env
    const isProduction = process.env.NODE_ENV === 'production';

    // Halt if .env.local does not exists
    if ( !await F('.env.local').exists() )
        halt(`\nCopy ${chalk.bold('.env')} to ${chalk.bold('.env.local')} and update properties for your env.`, 1, false);

    // Load env properties
    // First .env then override with .env.local
    let envProperties = {};
    ['.env', '.env.local'].map( envPath => {
        const envData = dotEnv.config({ path: envPath });
        envData.error && halt(`Parse error in ${envPath} // ${envData.error}`, 1, true);
        envProperties = { ...envProperties, ...envData.parsed };
    });

    // Bundler options
    const options = {
        outDir : './dist',
        //outFile : 'index.html',
        publicUrl : envProperties.BASE || '',
        logLevel : config.logLevel,
        cache : true,
        cacheDir : '.cache',
        contentHash : isProduction,
        minify : false,//isProduction,
        scopeHoist : isProduction, // FIXME - Test it in dev with a certain flag ?
        target : 'browser',
        watch : !isProduction,
        hmr : !isProduction,
        sourceMaps : !isProduction,
        detailedReport : isProduction,
        env: {
            ...process.env,
            ...envProperties
        }
    };

    // Get html entries
    const entries = await M( 'src/*.html' ).paths();

    // Create Parcel bundler
    const bundler = new Bundler( entries, options );

    // TODO : Gestion des properties, dotenv ?
    const properties = {};

    // Deploy files
    require('./bundler-deploy-plugin').connect( bundler, config.deploy, properties );

    // Create manifest file
    require('./bundler-manifest-plugin').connect( bundler );

    // TODO : Organize plugin

    // Check typescript if not disabled
    if (!noCheck)
        await require('./bundler-typescript-checker-plugin').connect( bundler );

    // Start bundler
    const bundle = await bundler.bundle();
};