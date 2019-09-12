const { recursiveChangeExtension } = require("./utils");
const { execSync } = require("../../libraries/node-cli/cli");

const glob = require("glob");
const rimraf = require("rimraf");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");

// Paths to templates
const tsconfigTemplatePath  = path.join( 'libraries', 'tsconfig.template.json' );
const npmignoreTemplatePath = path.join( 'libraries', 'template.npmignore' );
const globalTemplatePath    = path.join( 'libraries', 'Global.template.d.ts' );

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
 * TODO DOC
 * @param libraryName
 * @param buildLevel
 * @param progress
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
    fs.copyFileSync(tsconfigTemplatePath,   libraryConfigPath);
    fs.copyFileSync(npmignoreTemplatePath,  path.join( libraryPath, '.npmignore' ));
    fs.copyFileSync(globalTemplatePath,     path.join( libraryPath, 'src', '_global.d.ts' ));

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
        // Browse all .js and .mjs files in dirst folder
        const allJsFiles = glob.sync( path.join(distPath, '**/*.?(m)js') );
        //const allJsFiles = glob.sync( path.join(distPath, '**/*.js') );

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

            // Remove _index.mjs
            if ( fileName.indexOf('_index.mjs') !== -1 ) return;

            // Compress file as gzip to know its size
            const zipped = zlib.gzipSync(fs.readFileSync(destinationFileName));

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
            ||
            !fs.existsSync(path.join( libraryPath, 'src' ))
        ) return;

        // Count and call handler
        found ++;
        handler( libraryName );
    });

    // Return total found libraries
    return found;
};