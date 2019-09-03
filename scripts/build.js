const {halt, table, task, newLine} = require("../libraries/node-cli/cli");
const {listLibraries, buildLibrary} = require("./lib/libraries");

// Get library to build from command arguments
// We'll build all (true) if we have no library name as second argument
const argumentLibrary = process.argv[2] || null;

// Counters
let totalBuiltLibraries = 0;

newLine();

// Browse all libraries having a package.json
const foundLibraries = listLibraries( argumentLibrary, ( libraryName ) =>
{
    // Count this library as found
    const buildTask = task( `Building ${libraryName}` );

    try
    {
        // Build and get minified results if not a node lib
        let minifyResults = buildLibrary( libraryName, 2, buildTask.progress );
        totalBuiltLibraries ++;
        buildTask.success();

        // Show minified results if not a node lib
        if ( Array.isArray(minifyResults) )
            table( minifyResults, ' ⟶   ', '    - ', '', [30] );

        // New line for next task
        newLine();
    }

    // Show error and exit with code
    catch ( e ) { buildTask.error( e, 1 ); }
});

// Show error message if requested library is not found
if ( foundLibraries === 0 && argumentLibrary !== null )
    halt(`Unable to find library ${argumentLibrary}`);