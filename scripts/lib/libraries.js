const { execSync, askList, print, newLine } = require("@solid-js/cli");
const { recursiveChangeExtension } = require("./utils");
const glob = require("glob");
const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const chalk = require("chalk");

// --–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–----- LIBRARY BROWSING

/**
 * Browse all libraries having a package.json file.
 * @param filterLibrary Pass a name as string to filter to only this library
 * @param handler Called for each found lib
 */
exports.listLibraries = function ( filterLibrary = null, handler )
{
    let found = 0;
    glob.sync( path.join('libraries', '*') ).map( libraryPath =>
    {
        // Get current library name from path
        const libraryName = path.basename( libraryPath );

        // Do not add libraries starting with _
        if (libraryName.indexOf('_') === 0) return;

        // Do not continue if we do not need to build this lib
        if (
            filterLibrary !== null
            &&
            libraryName.toLowerCase() !== filterLibrary.toLowerCase()
        )
            return;

        // Do not continue if there is no package.json or no src
        if (
            !fs.existsSync(path.join( libraryPath, 'package.json' ))
            //||
            //!fs.existsSync(path.join( libraryPath, 'src' ))
        ) return;

        // Count and call handler
        found ++;
        handler( libraryName );
    });

    // Return total found libraries
    return found;
};

/**
 * Auto target library, and call handler with found lib names.
 * Can target all libs if needSpecificLib is false and no lib name is given.
 * If any lib name is given, but not found, cli will ask user which lib to use.
 * @param needSpecificLib If we do not allow to find all libs, set to true.
 * @param handler Called with found lib names
 * @returns {Promise<void>}
 */
exports.autoTargetLibrary = async function ( needSpecificLib, handler )
{
    // Get library to target from command arguments
    let argumentLibrary = process.argv[2] || null;

    // If we need a library and user didn't gave us one
    if ( (needSpecificLib && !argumentLibrary) || needSpecificLib === 2 )
    {
        // Ask which one from library list
        const list = [];
        exports.listLibraries( null, a => list.push(a) );
        argumentLibrary = await askList(`Please choose which library`, list);
    }

    // We can now list all or select
    const foundLibraries = exports.listLibraries( argumentLibrary, handler );

    // Show error message if requested library is not found
    if ( foundLibraries === 0 && argumentLibrary !== null )
    {
        print(chalk.red.bold( `  Unable to find library ${argumentLibrary}`) );
        newLine();
        exports.autoTargetLibrary( 2, handler );
    }
}

// --–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–----- PACKAGE JSON

/**
 * Get package.json data for a given library name.
 * Will return null if package.json not found
 */
exports.getLibraryPackageJson = function ( libraryName )
{
    // Target library path and package.json
    const libraryPath = path.join( 'libraries', libraryName );
    const packagePath = path.join( libraryPath, 'package.json' );

    // Can't test if there is no package.json
    if ( !fs.existsSync(packagePath) ) return null;

    // Load package.json and search for scripts.test or scripts.tests
    const requirePath = path.join( process.cwd(), packagePath );
    return require( requirePath );
}

// --–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–----- LIBRARY BUILDING

// Files copied to package before build
const templateRootPath = path.join( 'libraries', '_template' );
//const templateFiles = glob.sync(path.join( templateRootPath, '*' ), { dot: true });
const templateFiles = [
    '.npmignore',
    'tsconfig.json'
].map( f => path.join(templateRootPath, f) );

// All terser options @see https://github.com/terser/terser
const terserOptions = [
    // Compress and shorten names
    '--compress',
    '--mangle',
    // Set env as production for dead code elimination
    '-d process.env.NODE_ENV=\"PRODUCTION\"',
    // Keep class names but do not keep function names
    '--keep_classnames',
    //'--keep_fnames',
    // Allow top level mangling
    '--toplevel',
    // Threat as module (remove "use strict")
    '--module',
];

/**
 * Build library for given name.
 * @param libraryName
 * @param buildLevel
 *           0 -> Build only CommonJS
 *           1 -> Build EsNext modules and CommonJS
 *           2 -> Also build .min.js + estimate gzip size. Only if not a node lib.
 * @param progress Called each time build progresses
 */
exports.buildLibrary = function ( libraryName, buildLevel = 1, progress )
{
    // Update percentage (0%)
    progress && progress( 0, 1 );

    // Compute library typescript config path
    const libraryPath = path.join( 'libraries', libraryName );
    const libraryConfigPath = path.join( libraryPath, 'tsconfig.json' );
    const distPath = path.join(libraryPath, 'dist');

    // Copy npmignore and tsconfig from templates
    templateFiles.map( file => fs.copyFileSync(file, path.join(libraryPath, path.basename( file ))) );

    // Clean files
    rimraf.sync( distPath );

    // Will compile typescript files to js files in two phases
    if ( buildLevel >= 1 )
    {
        // Execute typescript to compile modules as esnext (with import statements)
        // Do not add declaration files (.d.ts)
        execSync(`tsc -p ${libraryConfigPath} --declaration false --module esnext`);

        // Rename every js file to mjs file
        recursiveChangeExtension( distPath, '.js', '.mjs' );

        // Update percentage
        progress && progress( 1, buildLevel + 1);
    }

    // Execute typescript to compile modules as commonjs (with require statements)
    // Do add declaration files (.d.ts) this time
    execSync(`tsc -p ${libraryConfigPath} --declaration true --module commonjs`);

    // Update percentage
    progress && progress( buildLevel >= 1 ? 2 : 1, buildLevel + 1);

    // If we need to minify this lib
    // and this lib is not a node one (no need to minify for node)
    if ( libraryName.indexOf('node-') !== 0 && buildLevel >= 2 )
    {
        // Browse all .js and .mjs files in dist folder
        const allJsFiles = glob.sync( path.join(distPath, '**/*.?(m)js') );

        // Browse all those files and compress every of them adding a .min in file name
        let output = [];
        allJsFiles.map( (fileName, i) =>
        {
            // Create destination file name
            const destinationFileName = fileName
            .replace('.mjs', '.min.mjs')
            .replace('.js', '.min.js');

            // Compress this file with terser and options
            execSync(`node_modules/.bin/terser ${terserOptions.join(' ')} -o ${destinationFileName} -- ${fileName}`);

            // Update percentage for each file
            progress && progress( 2 + ((i+1) / allJsFiles.length), buildLevel + 1 );

            // Filter out non module files
            if ( fileName.indexOf('.mjs') === -1 ) return;

            // Compress file as gzip to know its size
            const zipped = zlib.gzipSync( fs.readFileSync(destinationFileName) );

            // Add terser stats to output
            output.push([
                path.basename( fileName ),
                fs.statSync( fileName ).size,
                fs.statSync( destinationFileName ).size,
                zipped.length
            ])
        });
        return output;
    }
};

// --–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–----- LIBRARY TESTING

/**
 * 'npm run test' a lib if tests are available.
 */
exports.testLibrary = function ( libraryName )
{
    const libraryPath = path.join( 'libraries', libraryName );
    const packageContent = exports.getLibraryPackageJson( libraryName );

    if ( !('scripts' in packageContent) ) return;
    const hasTest = 'test' in packageContent.scripts;
    const hasTests = 'tests' in packageContent.scripts;
    if ( !hasTest && !hasTests ) return;

    // Execute this test
    execSync(`npm run ${hasTest ? 'test' : 'tests'}`, 3, {
        cwd: libraryPath
    });
}

// --–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–--–-----
