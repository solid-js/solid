import { untab } from "@solid-js/core";
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');

/**
 * Size of a tab for every CLI function.
 * Can be changed
 */
export let cliTabSize = 3;

// ----------------------------------------------------------------------------- PRINT UTILITIES

/**
 * Create a specified number of char in a string. Default are spaces.
 */
export function repeat ( total:number, char:string = ' ' ) {
	let buffer = '';
	for ( let i = 0; i < total; i ++ ) buffer += char;
	return buffer
}

/**
 * TODO
 * @param total
 * @param content
 */
export function indent ( total:number, content = '' ) {
	return repeat( total * cliTabSize, " " ) + content;
}

/**
 * TODO
 * @param content
 * @param newLine
 */
export function print ( content:string, newLine:string = "\n\r" ) {
	process.stdout.write( content );
	newLine && process.stdout.write( newLine );
}

/**
 * Print a new line
 */
export function newLine () { process.stdout.write('\r\n'); }


// ----------------------------------------------------------------------------- PRINT REMOVABLE LINE

/**
 * TODO
 * @param content
 */
export function printLine ( content:string )
{
	const niceContent = nicePrint( content, { output:'return', newLine: false } );
	const strLen = stripAnsi( niceContent ).length;

	print( niceContent, null );

	return ( newContent:string, last = true ) => {
		process.stdout.cursorTo( 0 );
		print( repeat( strLen ), null );
		process.stdout.cursorTo( 0 );

		if ( last ) {
			printLine( newContent )
			newLine();
			return null;
		}
		return printLine( newContent );
	}
}

// ----------------------------------------------------------------------------- NICE PRINT

export type TNicePrintOutput = 'stdout'|'stderr'|'return';

interface INicePrintOptions
{
	newLine		:string|null|boolean
	output		:TNicePrintOutput,
	code		:number
	untab		:"auto"|"last"|number|false
	replaceTabs	:boolean
}

const _nicePrintStyleReplacerRegex = /\{([a-z]*\/?[a-z]+)\}([^{]*)(\{\/\})?/gi;

const _formatters = {
	'bold'		: chalk.bold,
	'underline'	: chalk.underline,
	'strike'	: chalk.strikethrough,
	'italic'	: chalk.italic,

	'red'		: chalk.red,
	'yellow'	: chalk.yellow,
	'cyan'		: chalk.cyan,
	'blue'		: chalk.blue,
	'green' 	: chalk.greenBright,
	'purple'	: () => chalk.keyword('purple'),
	'orange'	: () => chalk.keyword('orange'),
	'grey'		: chalk.gray,
	'lite'		: chalk.gray,
	'white'		: chalk.white,

	'invert' 	: chalk.inverse,
};

function styleReplacer ( from:string, identifier:string, content )
{
	//console.log('>', {from, value: identifier, content});

	// Identifier is just slash, this is a close tag {/}
	if ( identifier == '/' )
		return chalk.reset()

	// Split identifiers
	const split = identifier.toLowerCase().split('/');

	// Get chained list of formatters from identifier
	let formattersChain = [];
	split.map( marker => {
		for ( const key of Object.keys(_formatters) ) {
			if ( key.indexOf( marker ) !== 0 ) continue;
			formattersChain.push(  _formatters[ key ] );
			break;
		}
	})

	// Execute all formatters in chain like so :
	// Ex : chalk.bold( chalk.italic( chalk.red( content ) ) )
	return formattersChain.reduce( (previous, current) => current( previous ), content);
}

/**
 * TODO DOC
 * @param template
 * @param options
 */
export function nicePrint ( template:string, options:Partial<INicePrintOptions> = {} )
{
	options = {
		newLine: "\n",
		output: 'stdout',
		code: 0,
		untab: "last",
		replaceTabs: true,
		...options
	};

	// Untab
	if ( options.untab !== false )
		template = untab( template, options.untab )

	// Process nice print templating with styleReplacer()
	const lines = template.split("\n").map( line =>
		line.replace(_nicePrintStyleReplacerRegex, styleReplacer)
	)

	// Add reset at each end of line and add line jumps
	let content = lines.join( chalk.reset() + "\n" )

	// Replace all tabs by spaces
	if ( options.replaceTabs )
		content = content.replace(/\t/gmi, indent(1));

	// Add new line
	if ( options.newLine )
		content += options.newLine;

	// Go to stdout
	if ( options.output == 'stdout')
		process.stdout.write( content );

	// Go to stderr
	else if ( options.output == 'stderr' )
		process.stderr.write( content );

	// Exit if we have an error code
	options.code > 0 && process.exit( options.code );
	return content;
}


// ----------------------------------------------------------------------------- CLI UTILITIES

/**
 * Show a big old banner
 * @param title
 * @param width
 * @param margin
 * @param padding
 */
export function banner ( title:string, width = 78, margin = 1, padding = 2 )
{
	const marginBuffer = repeat( margin );
	const line = marginBuffer + chalk.bgWhite( repeat( width ) );
	print( line );
	print( marginBuffer + chalk.bgWhite.black( repeat( padding ) + title + repeat( width - padding - title.length )) );
	print( line );
}

/**
 * Print a nice table in stdout
 * @param lines Two dimensions array to show as table. First dimension are lines, second dimensions are columns.
 * @param firstLineAreLabels Show first line in bold
 * @param minColumnWidths Default min widths for every columns ( for example : [ 10, 20 ] )
 * @param lineStart String to print before each line
 * @param lineEnd String to print after each line
 * @param separator Separator to show between each column.
 */
export function table ( lines:string[][], firstLineAreLabels = false, minColumnWidths:number[] = [], lineStart = ' ', lineEnd = '', separator = chalk.grey(' │ ') )
{
	// Init column widths and total number of columns from arguments
	let columnWidths = minColumnWidths;
	let totalColumns = minColumnWidths.length;

	let prevColumnPosition = stripAnsi( lineStart ).length;
	const columnPositions = [ prevColumnPosition ];

	// Measure columns widths
	lines.map(
		line => line.map( (column, columnIndex) => {
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
		lineStart && process.stdout.write( lineStart );

		// Browse line's columns
		line.map( (column, columnIndex) => {
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
				repeat( columnWidth - stripAnsi(stringColumn).length ),
				isLastColumn ? lineEnd : separator
			].join('');

			process.stdout.write( content );

			if ( lineIndex === lines.length - 1)
			{
				prevColumnPosition += stripAnsi( content ).length;
				columnPositions[ columnIndex + 1 ] = prevColumnPosition;
			}
		});

		// Go to next line
		newLine();
	});

	return columnPositions;
}
