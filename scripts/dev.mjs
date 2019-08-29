import {buildLibrary, listLibraries} from "./lib/libraries";
import path from "path";
import config from "./lib/config";
import {exec, halt, log, task} from "./lib/cli";
import * as child_process from "child_process";


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
        buildLibrary( libraryName, true );
        buildTask.success();
    }
    catch ( e )
    {
        buildTask.error( e, 1 );
    }

    const libraryPath = path.join( config.paths.libraries, libraryName );

    child_process.spawnSync('node', ['dev'], {
        cwd: libraryPath,
        env: process.env,
        stdio: [process.stdin, process.stdout, process.stderr],
        encoding: 'utf-8'
    });
});

// Show error message if requested library is not found
if ( foundLibraries === 0 )
{
    halt(`Unable to find library ${argumentLibrary}`);
}