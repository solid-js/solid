const path = require( "path" );
const fs = require( "fs" );
const { task } = require( "@solid-js/cli" );
const { buildLibrary, testLibrary } = require( "./lib/libraries" );
const { newLine } = require("@solid-js/cli");
const { autoTargetLibrary } = require("./lib/libraries");

newLine();
autoTargetLibrary( true, ( libraryName ) =>
{
    // Target library
    const libraryPath = path.join( 'libraries', libraryName );
    const srcPath = path.join( libraryPath, 'src' );

    // If library does have a src folder, do not build it
    if ( !fs.existsSync(srcPath) ) return;

    const buildTask = task( `Building ${libraryName}` );
    try {
        buildLibrary( libraryName, 0, buildTask.progress );
        buildTask.success();
    }
    // Show error and exit with code
    catch ( e ) { buildTask.error( e, 1 ); }

    // Test this lib if possible
    newLine();
    testLibrary( libraryName );

    // New line for next task
    newLine();
});