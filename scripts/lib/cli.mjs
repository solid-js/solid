import { execSync } from "child_process";
import chalk from "chalk";

// Hooked standard output / error and exit function
// Overridable with hookStandards function
const stds = {
    out: process.stdout,
    err: process.stderr,
    exit: process.exit
};

// Create a specified number of space in a string
function createSpaces ( totalSpaces )
{
    let spaces = '';
    for (let i = 0; i < totalSpaces; i ++) spaces += ' ';
    return spaces
}

// Go to next line
const newLine = () => stds.out.write('\r\n');

// Hookable console.log
const consoleLog = message => {
    stds.out.write( message );
    newLine();
};

// Hookable console.error
const consoleError = message => {
    stds.err.write( message );
    newLine();
};

// ----------------------------------------------------------------------------- CONFIGURATION

/**
 * Hook every stdout and stderr calls to another function.
 * Useful if you want to print something using this lib to a string and not to the current stdout.
 * @param stdout Your standard output implementation. Default is process.stdout
 * @param stderr Your standard error implementation. Default is process.stderr
 * @param exit Your process.exit function.
 */
export function hookStandards ( stdout = process.stdout, stderr = process.stderr, exit = process.exit )
{
    stds.out = stdout;
    stds.err = stderr;
    stds.exit = exit;
}

// ----------------------------------------------------------------------------- CLI UTILITIES

/**
 * Create a new task line into the standard output.
 * Returned object will allow to change current task status.
 *
 * Example : const buildTask = task('Building')
 * Will show : ➤ Building ...
 *
 * Then you can change status of this task by calling :
 *
 * TASK SUCCESS
 * buildTask.success() : ✔ Building
 *
 * TASK ERROR
 * buildTask.error( errorObject, code ) : ✘ Building
 * errorObject can be :
 * - null (will print nothing)
 * - a string
 * - an object containing stdout and stderr properties
 * Will exit if code is > to 0. Note : exit can be hooked with hookStandards().
 *
 * CUSTOM TASK STATE
 * buildTask.custom('!') : ! Building
 *
 * TASK END
 * buildTask.end() : ✔ Building
 * Will just remove trailing dots and bold.
 *
 * TASK PERCENTAGE
 * buildTask.percentage( 10, 100 ) : ✔ Building ██░░░░░░░░░░░░
 * Will show a percentage bar.
 * buildTask.percentage( 10, 100, 50 ) to set bar width
 *
 * @param message Task's message. Mandatory.
 * @param dots Change trailing dots if needed.
 * @returns
 */
export function task ( message, dots = ' ...' )
{
    // Function to build a state message
    const buildState = ( state, bold ) => ` ${state}  ${bold ? chalk.bold(message) : message}`;

    // Build and store working to know where to print after
    const workingMessage = buildState(`➤`, true);

    // Show task line starting with an arrow and with trailing dots
    stds.out.write( workingMessage + dots );

    // Number of char to clear after message
    let overflowToClear = dots.length;

    // Update task line state
    function updateState ( state, bold = false )
    {
        // Remove arrow and replace by step ASCII if defined
        if ( state )
        {
            // Clear all line
            stds.out.cursorTo( 0 );
            stds.out.write( createSpaces(workingMessage.length + overflowToClear) );

            // Build new state
            stds.out.cursorTo( 0 );
            stds.out.write( buildState(state, bold) );
        }

        // Go to new line
        newLine();
    }

    /**
     * Show a percentage bar next to the task name
     * @param current Current value
     * @param total Total value to compare current value with ( 1 and 10 will make 10 percent )
     * @param width Bar width. Default is 30px
     */
    function updateProgress ( current, total, width = 30 )
    {
        // Set overflow to clear from bar width
        overflowToClear = Math.max(overflowToClear, width + 2);

        // Create the bar from two chars
        let output = '';
        for (let i = 0; i < width; i ++)
            output += ( current / total > i / width ) ? '█' : '░';

        // Write progress bar
        stds.out.cursorTo( 0 );
        stds.out.write( workingMessage + '  ' + output );
    }

    /**
     * Remove trailing dots and replace arrow by a red error  mark
     * @param errorObject Will try to show error object in std
     * @param code Halt if there is an error code ( > 0 )
     */
    function updateErrorState ( errorObject, code = 0 )
    {
        // Update with an error mark
        updateState( chalk.red('✘'), true );

        // Add a line separator for errors
        newLine();

        // Try to show error
        if ( errorObject != null )
        {
            // In red if this is a string
            if ( typeof errorObject === 'string' )
            {
                consoleError( chalk.red.bold( errorObject ) )
            }

            // stdout and stderr if an exec error
            else if ( errorObject.stdout != null )
            {
                const stderr = (errorObject.stderr || '').toString();
                const stdout = (errorObject.stdout || '').toString();
                stderr && consoleError( stderr );
                stdout && consoleLog( stdout );
            }

            // Or just try to log it
            else consoleLog( errorObject );
        }

        // Halt if there is an error code
        code > 0 && stds.exit( code );
    }

    // Return an object to allow caller to control this task
    return {
        // End task. Keep arrow but remove trailing dots
        end         : () => updateState( `➤` ),
        // Remove trailing dots and replace arrow by a green success mark
        success     : () => updateState( chalk.green('✔') ),
        // Custom char state update
        custom      : updateState,
        // Inject error controller
        error       : updateErrorState,
        // Percentage indicator
        progress    : updateProgress
    }
}

/**
 * Halt with an error message.
 */
export function halt ( str = null, code = 1 )
{
    str && consoleError( chalk.red.bold( str ) );
    str && consoleError('');
    stds.exit( code );
}

/**
 * Exec a command and return stdout as string.
 * By default stdout is hidden.
 * @param command Command to execute.
 * @param options See execSync options. Ignore to call and hide command's stdout.
 * @returns Stringified result of command's stdout
 */
export function exec ( command, options )
{
    // Disable stdout if there are no options
    options = options || { stdio: [0, null, 2] };

    // Call command with default options
    const result = execSync(command, {
        stdio: [0, 1, 2],
        env: process.env,
        ...options
    });

    // Stringify stdout and return it
    return result ? result.toString() : null;
}

/**
 * Print a nice table in stdout
 * @param lines Two dimensions array to show as table. First dimension are lines, second dimensions are columns.
 * @param sep Separator to show between each column.
 * @param lineStart String to print before each line
 * @param lineEnd String to print after each line
 * @param minColumnWidths Default min widths for every columns ( for example : [ 10, 20 ] )
 */
export function table ( lines, sep = " | ", lineStart = ' ', lineEnd = '', minColumnWidths = [] )
{
    // Init column widths and total number of columns from arguments
    let columnWidths = minColumnWidths;
    let totalColumns = minColumnWidths.length;

    // Measure columns widths
    lines.map(
        line => line.map( (column, columnIndex) =>
        {
            // Count total columns for every lines
            totalColumns = Math.max(totalColumns, columnIndex);

            // Convert column value to string to avoid length to fail
            const stringColumn = column + '';

            // Measure column width and keep the largest
            columnWidths[ columnIndex ] = (
                ! (columnIndex in columnWidths)
                ? stringColumn.length
                : Math.max( columnWidths[ columnIndex ], stringColumn.length )
            );
        })
    );

    // Here we browse to print
    lines.map( line =>
    {
        // Print line start if needed
        lineStart && stds.out.write( lineStart );

        // Browse line's columns
        line.map( (column, columnIndex) =>
        {
            // Get column width and if last column
            const isLastColumn = ( columnIndex === totalColumns );
            const columnWidth = columnWidths[ columnIndex ];

            // Print column + spaces
            stds.out.write( column + createSpaces( columnWidth - column.length ) );

            // Write separator if not last column
            isLastColumn || stds.out.write( sep );
        });

        // Print line end if needed and go to next line
        lineEnd && stds.out.write( lineEnd );
        newLine();
    });
}