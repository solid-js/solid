const {halt, table, task, newLine, offset, print} = require("../libraries/node-cli/cli");
const {listLibraries, buildLibrary} = require("./lib/libraries");
const filesize = require("filesize");
const chalk = require("chalk");

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

    let minifyResults;
    try
    {
        // Build and get minified results if not a node lib
        minifyResults = buildLibrary( libraryName, 2, buildTask.progress );
        totalBuiltLibraries ++;
        buildTask.success();
    }

    // Show error and exit with code
    catch ( e ) { buildTask.error( e, 1 ); }

    // Show minified results if not a node lib
    if ( Array.isArray(minifyResults) )
    {
        // Style table
        let globalSize = 0;
        minifyResults = minifyResults.map( line => {
            globalSize += line[3];
            return line
                .map( (column, i) => i >= 1 ? filesize( column ) : column )
                .map( (column, i) => i === 3 ? chalk.cyan( column ) : column )
        });

        // Show results as table
        newLine();
        minifyResults.unshift(['File', 'Size', 'Minified', 'Gzip']);
        const positions = table( minifyResults, true, [20], '      ');
        print( offset(positions[3], chalk.cyan.bold( filesize(globalSize) )) );
    }

    // New line for next task
    newLine();
});

// Show error message if requested library is not found
if ( foundLibraries === 0 && argumentLibrary !== null )
    halt(`Unable to find library ${argumentLibrary}`);