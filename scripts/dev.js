const {buildLibrary, listLibraries} = require("./lib/libraries");
const path = require("path");
const {execSync, halt, task} = require("../libraries/node-cli/cli");


if (!(2 in process.argv))
    halt(`Please specify lib name`);

const argumentLibrary = process.argv[2];

// Browse all libraries having a package.json
const foundLibraries = listLibraries( argumentLibrary, ( libraryName ) =>
{
    // Count this library as found
    const buildTask = task( `Building ${libraryName}` );

    try
    {
        // Build library quickly (no commonjs / no minify)
        buildLibrary( libraryName, 0 );
        buildTask.success();
    }
    catch ( e )
    {
        buildTask.error( e, 1 );
    }

    const libraryPath = path.join( 'libraries', libraryName );

    execSync('node dev', 3, {
        cwd: libraryPath
    });
});

// Show error message if requested library is not found
if ( foundLibraries === 0 )
    halt(`Unable to find library ${argumentLibrary}`);