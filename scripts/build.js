const { log, task, halt, exec } = require('./cli');
const { recursiveChangeExtension } = require('./utils');
const config = require('./config');

const GlobSync = require('glob').sync;
const path = require('path');
const fs = require('fs');

const tsconfigTemplatePath = path.join( config.paths.libraries, 'tsconfig.template.json' );
const npmignoreTemplatePath = path.join( config.paths.libraries, 'template.npmignore' );

// Get library to build from command arguments
// We'll build all (true) if we have no library name as second argument
const argumentLibrary = process.argv[2] || true;

// Counters
let totalBuiltLibraries = 0;
let totalFoundLibraries = 0;

// Browse all libraries
GlobSync( path.join(config.paths.libraries, '*') ).map( libraryPath =>
{
    // Get current library name from path
    const libraryName = path.basename( libraryPath );

    // Do not continue if we do not need to build this lib
    if (
        argumentLibrary !== true
        &&
        libraryName.toLowerCase() !== argumentLibrary.toLowerCase()
    )
    return;

    // Compute library typescript config path
    const libraryConfigPath = path.join( libraryPath, 'tsconfig.json' );

    // Do not continue if there is no package.json
    if (!fs.existsSync(path.join( libraryPath, 'package.json' ))) return;

    // Copy npmignore and tsconfig from templates
    fs.copyFileSync(tsconfigTemplatePath, libraryConfigPath);
    fs.copyFileSync(npmignoreTemplatePath, path.join( libraryPath, '.npmignore' ));

    // Count this library as found
    const buildTask = task( `Building ${libraryName}` );
    totalFoundLibraries ++;

    // Will compile typescript files to js files in two phases
    try
    {
        // Execute typescript to compile modules as esnext (with import statements)
        // Do not add declaration files (.d.ts)
        exec(`tsc -p ${libraryConfigPath} --declaration false --module esnext`);

        // Rename every js file to mjs file
        recursiveChangeExtension( libraryPath, '.js', '.mjs' );

        // Execute typescript to compile modules as commonjs (with require statements)
        // Do add declaration files (.d.ts) this time
        exec(`tsc -p ${libraryConfigPath} --declaration true --module commonjs`);

        // Count it as built
        totalBuiltLibraries ++;
        buildTask.success();
    }
    catch ( e )
    {
        buildTask.error( e, 1 );
    }
});

// Show error message if requested library is not found
if ( totalFoundLibraries === 0 && argumentLibrary !== true )
{
    halt(`Unable to find library ${argumentLibrary}`);
}

