import { recursiveChangeExtension } from "./utils";
import { exec, halt, task } from "./cli";
import * as glob from "glob";
import * as rimraf from "rimraf";
import config from "./config";
import path from "path";
import fs from "fs";

// Paths to templates
const tsconfigTemplatePath = path.join( config.paths.libraries, 'tsconfig.template.json' );
const npmignoreTemplatePath = path.join( config.paths.libraries, 'template.npmignore' );
const globalTemplatePath = path.join( config.paths.libraries, '_global.template.ts' );

/**
 *
 * @param libraryName
 * @param quickBuild
 */
export function buildLibrary ( libraryName, quickBuild = false )
{
    // Compute library typescript config path
    const libraryPath = path.join( config.paths.libraries, libraryName );
    const libraryConfigPath = path.join( libraryPath, 'tsconfig.json' );
    const distPath = path.join(libraryPath, 'dist');

    // Copy npmignore and tsconfig from templates
    fs.copyFileSync(tsconfigTemplatePath,   libraryConfigPath);
    fs.copyFileSync(npmignoreTemplatePath,  path.join( libraryPath, '.npmignore' ));
    fs.copyFileSync(globalTemplatePath,     path.join( libraryPath, 'src', '_global.ts' ));

    // Clean files
    rimraf.sync( distPath );

    // Will compile typescript files to js files in two phases
    if ( !quickBuild )
    {
        // Execute typescript to compile modules as esnext (with import statements)
        // Do not add declaration files (.d.ts)
        exec(`tsc -p ${libraryConfigPath} --declaration false --module esnext`);

        // Rename every js file to mjs file
        recursiveChangeExtension( distPath, '.js', '.mjs' );
    }

    // Execute typescript to compile modules as commonjs (with require statements)
    // Do add declaration files (.d.ts) this time
    exec(`tsc -p ${libraryConfigPath} --declaration true --module commonjs`);
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
        if (!fs.existsSync(path.join( libraryPath, 'package.json' ))) return;

        // Count and call handler
        found ++;
        handler( libraryName );
    });

    // Return total found libraries
    return found;
}