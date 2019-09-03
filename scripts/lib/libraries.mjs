import { recursiveChangeExtension } from "./utils";
import { exec, halt, task } from "./cli";
import * as glob from "glob";
import * as rimraf from "rimraf";
import config from "./config";
import path from "path";
import fs from "fs";
import filesize from "filesize";

// Paths to templates
const tsconfigTemplatePath = path.join( config.paths.libraries, 'tsconfig.template.json' );
const npmignoreTemplatePath = path.join( config.paths.libraries, 'template.npmignore' );

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
 *
 * @param libraryName
 * @param buildLevel
 * @param progress
 */
export function buildLibrary ( libraryName, buildLevel = 1, progress )
{
    // Update percentage (0%)
    progress && progress( 0, 1 );

    // Compute library typescript config path
    const libraryPath = path.join( config.paths.libraries, libraryName );
    const libraryConfigPath = path.join( libraryPath, 'tsconfig.json' );
    const distPath = path.join(libraryPath, 'dist');

    // Copy npmignore and tsconfig from templates
    fs.copyFileSync(tsconfigTemplatePath,   libraryConfigPath);
    fs.copyFileSync(npmignoreTemplatePath,  path.join( libraryPath, '.npmignore' ));

    // Clean files
    rimraf.sync( distPath );

    // Will compile typescript files to js files in two phases
    if ( buildLevel >= 1 )
    {
        // Execute typescript to compile modules as esnext (with import statements)
        // Do not add declaration files (.d.ts)
        exec(`tsc -p ${libraryConfigPath} --declaration false --module esnext`);

        // Rename every js file to mjs file
        recursiveChangeExtension( distPath, '.js', '.mjs' );

        // Update percentage
        progress && progress( 1, buildLevel + 1);
    }

    // Execute typescript to compile modules as commonjs (with require statements)
    // Do add declaration files (.d.ts) this time
    exec(`tsc -p ${libraryConfigPath} --declaration true --module commonjs`);

    // Update percentage
    progress && progress( buildLevel >= 1 ? 2 : 1, buildLevel + 1);

    // If we need to minify this lib
    // and this lib is not a node one (no need to minify for node)
    if ( libraryName.indexOf('node-') !== 0 && buildLevel >= 2 )
    {
        // Browse all .js and .mjs files in dirst folder
        //const allJsFiles = glob.sync( path.join(distPath, '**/*.?(m)js') );

        // TEMP -> Only js files for now ...
        const allJsFiles = glob.sync( path.join(distPath, '**/*.js') );

        // Browse all those files and compress every of them adding a .min in file name
        let output = [];
        allJsFiles.map( (fileName, i) =>
        {
            // Create destination file name
            const destinationFileName = fileName
                .replace('.mjs', '.min.mjs')
                .replace('.js', '.min.js');

            // Compress this file with terser and options
            exec(`node_modules/.bin/terser ${terserOptions.join(' ')} -o ${destinationFileName} -- ${fileName}`);

            // Update percentage for each file
            progress && progress( 2 + ((i+1) / allJsFiles.length), buildLevel + 1 );

            // Add terser stats to output
            output.push([
                path.basename( destinationFileName ),
                filesize( fs.statSync( destinationFileName ).size )
            ])
        });
        return output;
    }
}

/**
 * Browse all libraries having a package.json file.
 * @param filterLibrary Pass a name as string to filter to only this library
 * @param handler Called for each found lib
 */
export function listLibraries ( filterLibrary = null, handler )
{
    let found = 0;
    glob.sync( path.join(config.paths.libraries, '*') ).map( libraryPath =>
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

        // Do not continue if there is no package.json
        if ( !fs.existsSync(path.join( libraryPath, 'package.json' )) ) return;

        // Count and call handler
        found ++;
        handler( libraryName );
    });

    // Return total found libraries
    return found;
}