const {exec, execSync} = require('child_process');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');

// ----------------------------------------------------------------------------- PRINT UTILITIES

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
