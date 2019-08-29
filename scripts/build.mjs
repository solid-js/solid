import { listLibraries, buildLibrary } from "./lib/libraries";
import { halt, task } from "./lib/cli";

// Get library to build from command arguments
// We'll build all (true) if we have no library name as second argument
const argumentLibrary = process.argv[2] || null;

// Counters
let totalBuiltLibraries = 0;

// Browse all libraries having a package.json
const foundLibraries = listLibraries( argumentLibrary, ( libraryName ) =>
{
    // Count this library as found
    const buildTask = task( `Building ${libraryName}` );

    try
    {
        buildLibrary( libraryName );
        totalBuiltLibraries ++;
        buildTask.success();
    }
    catch ( e )
    {
        buildTask.error( e, 1 );
    }
});

// Show error message if requested library is not found
if ( foundLibraries === 0 && argumentLibrary !== null )
{
    halt(`Unable to find library ${argumentLibrary}`);
}

