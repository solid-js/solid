import {buildLibrary, listLibraries} from "./lib/libraries";
import path from "path";
import config from "./lib/config";
import {exec, halt, task} from "../libraries/node-cli/cli";


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

    const libraryPath = path.join( config.paths.libraries, libraryName );

    exec('node dev', {
        cwd: libraryPath,
        stdio: [0, 1, 2]
    });
});

// Show error message if requested library is not found
if ( foundLibraries === 0 )
{
    halt(`Unable to find library ${argumentLibrary}`);
}