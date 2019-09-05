const {exec, execSync} = require('child_process');
const chalk = require('chalk');

// Hooked standard output / error and exit function
// Overridable with hookStandards function
const stds = {
    out: process.stdout,
    err: process.stderr,
    exit: process.exit
};

// Hookable console.log
const consoleLog = message => {
    stds.out.write( message );
    exports.newLine();
};

// Hookable console.error
const consoleError = message => {
    stds.err.write( message );
    exports.newLine();
};

// ----------------------------------------------------------------------------- CONFIGURATION

/**
 * Hook every stdout and stderr calls to another function.
 * Useful if you want to print something using this lib to a string and not to the current stdout.
 * @param stdout Your standard output implementation. Default is process.stdout
 * @param stderr Your standard error implementation. Default is process.stderr
 * @param exit Your process.exit function.
 */
exports.hookStandards = function ( stdout = process.stdout, stderr = process.stderr, exit = process.exit )
{
    stds.out = stdout;
    stds.err = stderr;
    stds.exit = exit;
};

// ----------------------------------------------------------------------------- SMALL UTILITIES

/**
 * Create a specified number of char in a string. Default are spaces.
 */
exports.repeat = function (total, char = ' ' )
{
    let buffer = '';
    for (let i = 0; i < total; i ++) buffer += char;
    return buffer
};

/**
 * Print content on standard output
 * @param content Content to show
 * @param bold If we need to print it bold
 * @param newLine If we add a new line after printed chars
 */
exports.print = function ( content, bold = false, newLine = true )
{
    stds.out.write( bold ? chalk.bold(content) : content );
    newLine && exports.newLine();
};

/**
 * Offset a string by adding leading spaces
 * @param spaces Total spaces to add
 * @param content Content to offset
 * @returns {string}
 */
exports.offset = function ( spaces, content )
{
    return exports.repeat( spaces ) + content;
};

/**
 * Print a new line
 */
exports.newLine = function ()
{
    stds.out.write('\r\n');
};

/**
 * Halt with an error message.
 */
exports.halt = function ( content = null, code = 1, redAndBold = false )
{
    content && consoleError( redAndBold ? chalk.red.bold( content ) : content );
    content && consoleError('');
    stds.exit( code );
};

// ----------------------------------------------------------------------------- EXEC UTILITIES

const stdLevels = [
    [0, null, null],
    [0, 1, null],
    [0, null, 1],
    [0, 1, 2]
];

const makeExecOptions = (stdLevel, options) => ({
    stdio: stdLevels[ stdLevel ] || 'pipe',
    env: process.env,
    ...options
});

/**
 * Exec a command async and resolve stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * @param command Command to execute.
 * @param stdLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin
 * @param options See execSync options. Ignore to call and hide command's stdout.
 * @returns Promise with stdout if success, stderr if fail
 */
exports.exec = async function ( command, stdLevel = 0, options )
{
    return new Promise( (resolve, reject) =>
    {
        // Call command with default options
        exec(
            command,
            makeExecOptions(stdLevel, options),
            ( error, stdout, stderr) => {
                error
                ? reject( (stderr || '').toString() )
                : resolve( (stdout || '').toString() )
            }
        );
    });
};

/**
 * Exec a command and return stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * @param command Command to execute.
 * @param stdLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin
 * @param options See execSync options. Ignore to call and hide command's stdout.
 * @returns Stringified result of command's stdout
 */
exports.execSync = function ( command, stdLevel = 0, options )
{
    // Call command with default options
    const result = execSync(command, makeExecOptions(stdLevel, options));

    return result ? result.toString() : null;
};



// ----------------------------------------------------------------------------- CLI UTILITIES

/**
 * Show a big old banner
 * @param title
 * @param width
 * @param margin
 * @param padding
 */
exports.banner = function ( title, width = 78, margin = 1, padding = 2 )
{
    const marginBuffer = exports.repeat( margin );
    const line = marginBuffer + chalk.bgWhite( exports.repeat( width ) );
    consoleLog( line );
    consoleLog( marginBuffer + chalk.bgWhite.black( exports.repeat( padding ) + title + exports.repeat( width - padding - title.length )) );
    consoleLog( line );
};

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
 * - an Error object
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
 * @param icon Specify custom icon, default is ➤
 * @param dots Change trailing dots if needed.
 * @returns An object to allow changes of task's state. See function commentaries.
 */
exports.task = function ( message, icon = '➤', dots = ' ...' )
{
    // Function to build a state message
    const buildState = ( state, bold, c = message ) => ` ${state}  ${bold ? chalk.bold(c) : c}`;

    // Build and store working to know where to print after
    const workingMessage = buildState(icon, true);

    // Show task line starting with an arrow and with trailing dots
    stds.out.write( workingMessage + dots );

    // Number of char to clear after message
    let overflowToClear = dots.length;

    // Update task line state
    function updateState ( state, bold = false, clearOverflow = true, newText = message )
    {
        // Remove arrow and replace by step ASCII if defined
        if ( state )
        {
            if ( clearOverflow )
            {
                // Clear all line
                stds.out.cursorTo( 0 );
                stds.out.write( exports.repeat(workingMessage.length + overflowToClear) );
            }

            // Build new state
            stds.out.cursorTo( 0 );
            stds.out.write( buildState(state, bold, newText ) );
        }

        // Go to new line
        exports.newLine();
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
        updateState( chalk.red('✘'), true, false );

        // Try to show error
        if ( errorObject != null )
        {
            // Add a line separator for errors
            exports.newLine();

            // In red if this is a string
            if ( typeof errorObject === 'string' )
            {
                consoleError( exports.offset(6, chalk.red.bold( errorObject ) ) );
                exports.newLine();
            }

            // stdout and stderr if an exec error
            else if ( errorObject.stdout != null )
            {
                const stderr = (errorObject.stderr || '').toString();
                const stdout = (errorObject.stdout || '').toString();
                stderr && consoleError( stderr );
                stdout && consoleLog( stdout );
            }

            // Error object
            else if ( errorObject instanceof Error )
            {
                consoleError( errorObject.message );
            }

            // Or just try to log it
            else consoleError( JSON.stringify(errorObject) )
        }

        // Halt if there is an error code
        code > 0 && stds.exit( code );
    }

    // Return an object to allow caller to control this task
    return {
        // End task. Keep arrow but remove trailing dots
        end         : () => updateState( `➤` ),
        // Remove trailing dots and replace arrow by a green success mark
        success     : newText => updateState( chalk.green('✔'), false, true, newText ),
        // Custom char state update
        custom      : updateState,
        // Inject error controller
        error       : updateErrorState,
        // Percentage indicator
        progress    : updateProgress
    }
};

/**
 * Print a nice table in stdout
 * @param lines Two dimensions array to show as table. First dimension are lines, second dimensions are columns.
 * @param firstLineAreLabels Show first line in bold
 * @param sep Separator to show between each column.
 * @param lineStart String to print before each line
 * @param lineEnd String to print after each line
 * @param minColumnWidths Default min widths for every columns ( for example : [ 10, 20 ] )
 */
exports.table = function ( lines, firstLineAreLabels = false, sep = " | ", lineStart = ' ', lineEnd = '', minColumnWidths = [] )
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
    lines.map( (line, lineIndex) =>
    {
        // Print line start if needed
        lineStart && stds.out.write( lineStart );

        // Browse line's columns
        line.map( (column, columnIndex) =>
        {
            const stringColumn = column + '';

            // Get column width and if last column
            const isLastColumn = ( columnIndex === totalColumns );
            const columnWidth = columnWidths[ columnIndex ];

            let columnToPrint = (
                ( lineIndex === 0 && firstLineAreLabels )
                ? chalk.bold( stringColumn )
                : stringColumn
            );

            // Print column + spaces
            stds.out.write( columnToPrint + exports.repeat( columnWidth - stringColumn.length ) );

            // Write separator if not last column
            isLastColumn || stds.out.write( sep );
        });

        // Print line end if needed and go to next line
        lineEnd && stds.out.write( lineEnd );
        exports.newLine();
    });
};

// ----------------------------------------------------------------------------- UNIT TESTING

// If there is a running test, added tests will not start
let runningTest = false;

// List of waiting tests
const waitingTests = [];

/**
 * Run a test
 * @param name Name of the test / task
 * @param testHandler Called to initialized test
 * @returns {Promise<void>}
 */
async function runTest ( name, testHandler )
{
    // Tests are running now, put new tests in waiting line
    runningTest = true;

    // Current assertion index is starting at minus one because we start with increment in doNextAssertion
    let currentAssertIndex = -1;

    // All registered assertions and "it" methods
    const allAssertions = [];
    const it = ( should, handler ) => allAssertions.push({ should, handler });

    // Start task in CLI
    const task = exports.task( 'Test ' + name );

    // Call test initialization handler to have assertions list
    await testHandler( it );

    // If we had any failure in this testing
    // Used to stop all others tests if any fails
    let hadError = false;

    // Compute next assertion for this test
    async function doNextAssertion ()
    {
        // Go to next assertion
        currentAssertIndex ++;

        // Do not continue if there are no more assertions to check
        if ( !(currentAssertIndex in allAssertions) ) return;

        // Update progress on task
        task.progress( currentAssertIndex, allAssertions.length );

        // Target current assertion to check
        const assertionResult = allAssertions[ currentAssertIndex ];

        // Here we try assertion as a promise
        try
        {
            // Create a new self-awaited promise
            await new Promise( (resolve, reject) =>
            {
                // Call this "it" and pass assertion handler
                assertionResult.handler( (result, expectedValue = true) =>
                    // When "assert" is called, we check here if assertion is true
                    // If true, we resolve promise, otherwise promise fails
                    (result === expectedValue) ? resolve() : reject( {result, expectedValue} )
                )
            })
        }
        // If there are any failed assertion
        catch ( e )
        {
            // We stop any further testing
            hadError = true;

            // Set task cli as error state
            task.error();

            // Show error message
            exports.newLine();
            consoleError( exports.offset( 6, chalk.redBright.bold(`${name} failed at :`) ) );
            consoleError( exports.offset( 6, chalk.bold(`It ${assertionResult.should}.`)) );
            exports.newLine();

            // Show values
            consoleError( exports.offset( 6, `Received value : ${chalk.bold(e.result)}` ) );
            consoleError( exports.offset( 6, `Expected value : ${chalk.bold(e.awaitedValue)}` ) );
            exports.newLine();

            // Stop process here
            stds.exit( 1 );
        }

        // Continue to next assertion if there were no failure
        if ( !hadError ) await doNextAssertion();
    }

    // Start with first assertion
    await doNextAssertion();

    // All assertions are ok, update cli state
    task.success();

    // If we still have waiting tests
    if ( waitingTests.length > 0 )
    {
        // Target next test and do it
        const nextTest = waitingTests.shift();
        runTest(nextTest.name, nextTest.testHandler);
        return;
    }

    // All tests are done now
    runningTest = false;
}

/**
 * Create and declare a new Unit test.
 * Will wait previous test to finish to start new ones.
 * @param name Name of unit test to run. Will show in CLI.
 * @param testHandler Function with "it" parameter to declare list of assertions.
 */
exports.test = async function ( name, testHandler )
{
    // Put in waiting line if test are already running
    if ( runningTest )
    {
        waitingTests.push({
            name,
            testHandler
        });
    }

    else await runTest( name, testHandler );
};


// ----------------------------------------------------------------------------- UNIT TESTING

// All parsed args and list of commands
let parsedArgs;
let commandsList = {};

// Custom CommandError to be able to detect commands not found
class CommandError extends Error { }

exports.commands = {

    /**
     * Register a command
     * @param name Name of the command, lowercase
     * @param optionsOrHandler Default options of the command. Can be ignored.
     * @param handler Handler called with options as first argument.
     */
    add ( name, optionsOrHandler, handler = optionsOrHandler )
    {
        commandsList[name.toLowerCase()] = {
            options: optionsOrHandler,
            handler
        };
    },

    /**
     * Get registered commands list
     */
    list ()
    {
        return commandsList;
    },

    /**
     * Start parsing arguments and run command with options
     * @param defaultHandler Called when command has not been found.
     * @returns {Promise<void>}
     */
    async start ( defaultHandler )
    {
        // Get arguments parsed thanks to mri
        const mri = require('mri');
        const argv = process.argv.slice(2);
        parsedArgs = mri( argv );

        // If we have a command to start
        if ( parsedArgs._.length > 0 )
        {
            // Get command name
            const commandName = parsedArgs._[0].toLowerCase();

            // Remove command name from _ args
            parsedArgs._.shift();
            if (parsedArgs._.length ===  0)
                delete parsedArgs._;

            // Try to run
            try
            {
                await this.run( commandName, parsedArgs);
            }
            catch ( e )
            {
                // Start default handler if command has not been found
                if (e instanceof CommandError && defaultHandler)
                    await defaultHandler( commandName );
            }
        }

        // No command found, call default handler with empty command as argument
        else if ( defaultHandler )
            await defaultHandler( '' );
    },

    /**
     * Run any registered command
     * @param commandName Lowercase command name.
     * @param options Options to override from command's default options
     * @returns {Promise<*>}
     */
    async run ( commandName, options )
    {
        // Throw if command does not exists
        if ( !(commandName in commandsList) )
            throw new CommandError('Command not found');

        // Get command
        const command = commandsList[ commandName ];

        // Execute command with options on top of default options
        return await command.handler({
            ...command.options,
            ...options
        });
    }

};