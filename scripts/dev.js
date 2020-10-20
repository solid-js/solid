const {execSync, halt, task, newLine} = require("@solid-js/cli");
const {buildLibrary, autoTargetLibrary, getLibraryPackageJson} = require("./lib/libraries");
const path = require("path");

newLine();
autoTargetLibrary( true, ( libraryName ) =>
{
    const libraryPath = path.join( 'libraries', libraryName );

    // Check if this lib has a dev script
    const packageContent = getLibraryPackageJson( libraryName );
    if ( packageContent == null || !('scripts' in packageContent) || !('dev' in packageContent.scripts) )
        halt(`Unable to find scripts.dev in ${libraryName}'s package.json.`, 2, true);

    // Build library quickly (no commonjs / no minify)
    const buildTask = task( `Building ${libraryName}` );
    try
    {
        buildLibrary( libraryName, 0 );
        buildTask.success();
    }
    catch ( e ) { buildTask.error( e, 1 ); }

    execSync('node dev', 3, { cwd: libraryPath });
});