const {exec, execSync} = require('child_process');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');

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
				stds.out.cursorTo ? stds.out.cursorTo( 0 ) : stds.out.write("\n");
				stds.out.write( exports.repeat(workingMessage.length + overflowToClear) );
			}

			// Build new state
			stds.out.cursorTo ? stds.out.cursorTo( 0 ) : stds.out.write("\n");
			stds.out.write( buildState(state, bold, newText ) );
		}

		// Go to new line
		exports.newLine();
	}

	let previousAfterProgress = null;

	/**
	 * Show a percentage bar next to the task name
	 * @param current Current value
	 * @param total Total value to compare current value with ( 1 and 10 will make 10 percent )
	 * @param width Bar width. Default is 30px
	 * @param afterProgress Update text after the progress bar
	 */
	function updateProgress ( current, total, width = 30, afterProgress = null )
	{
		// Set overflow to clear from bar width
		overflowToClear = Math.max(overflowToClear, width + 2);

		// Create the bar from two chars
		let output = '';
		for (let i = 0; i < width; i ++)
			output += ( current / total > i / width ) ? '█' : '░';

		// Write progress bar
		stds.out.cursorTo ? stds.out.cursorTo( 0 ) : stds.out.write("\n");
		stds.out.write( workingMessage + '  ' + output );

		if (afterProgress)
			stds.out.write( ' ' + afterProgress );

		if ( afterProgress && previousAfterProgress )
			stds.out.write( module.exports.repeat(Math.max(0, previousAfterProgress.length - afterProgress.length), ' ') );

		previousAfterProgress = afterProgress;
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
		progress    : updateProgress,

		// Run handler
		async run ( handler )
		{
			try
			{
				await handler( this );
			}
			catch (e)
			{
				this.error( e );
				return;
			}

			this.success();
		}
	}
};

/**
 * Print a nice table in stdout
 * @param lines Two dimensions array to show as table. First dimension are lines, second dimensions are columns.
 * @param firstLineAreLabels Show first line in bold
 * @param minColumnWidths Default min widths for every columns ( for example : [ 10, 20 ] )
 * @param lineStart String to print before each line
 * @param lineEnd String to print after each line
 * @param separator Separator to show between each column.
 */
exports.table = function ( lines, firstLineAreLabels = false, minColumnWidths = [], lineStart = ' ', lineEnd = '', separator = chalk.grey(' │ ') )
{
	// Init column widths and total number of columns from arguments
	let columnWidths = minColumnWidths;
	let totalColumns = minColumnWidths.length;

	let prevColumnPosition = stripAnsi(lineStart.length);
	const columnPositions = [prevColumnPosition];

	// Measure columns widths
	lines.map(
		line => line.map( (column, columnIndex) =>
		{
			// Count total columns for every lines
			totalColumns = Math.max(totalColumns, columnIndex);

			// Convert column value to string to avoid length to fail
			// Strip ansi chars to count only visible chars
			const stringColumn = stripAnsi( column + '' );

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

			// Print column + spaces + separator
			const content = [
				columnToPrint,
				exports.repeat( columnWidth - stripAnsi(stringColumn).length ),
				isLastColumn ? lineEnd : separator
			].join('');

			stds.out.write( content );

			if ( lineIndex === lines.length - 1)
			{
				prevColumnPosition += stripAnsi( content ).length;
				columnPositions[ columnIndex + 1 ] = prevColumnPosition;
			}
		});


		// Go to next line
		exports.newLine();
	});

	return columnPositions;
};
