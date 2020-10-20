const {halt, table, task, newLine, offset, print} = require("../libraries/node-cli/cli");
const { testLibrary, autoTargetLibrary, buildLibrary } = require("./lib/libraries");
const filesize = require("filesize");
const chalk = require("chalk");

// Counters
let totalBuiltLibraries = 0;

newLine();

autoTargetLibrary(false, (libraryName) =>
{
    const buildTask = task( `Building ${libraryName}` );
    let minifyResults;

    try {
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

    // Test this lib if possible
    newLine();
    testLibrary( libraryName );

    // New line for next task
    newLine();
});