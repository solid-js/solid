import { ScalarObject } from "./types";

// ----------------------------------------------------------------------------- CHECK

/**
 * Check if a string represent a number, and a number only.
 * NaN and Infinity will be false.
 * @param number The string representing the number
 * @returns True if the string is representing a number.
 */
export function isNumber ( number:string ):boolean
{
	const f = parseFloat( number );
	return !isNaN( f ) && isFinite( f );
}

// ----------------------------------------------------------------------------- ALTER

/**
 * Prepend a number by a fixed number of zeros.
 *
 * For ex :
 * - 17 can become 00017
 *
 * Useful to target sprites or some renamed files.
 *
 * @param totalChars Total chars of output string (with added zeros)
 * @param number Base number
 * @param placeholder Default is a 0 char but can be changed
 * @returns Zero formatted number.
 */
export function zeroFill (totalChars:number, number:number, placeholder = '0'):string
{
	// Convert number to string and count chars
	const currentNumberAsString = number.toString();
	const totalCharsInCurrentNumber = currentNumberAsString.length;

	// Formatted output
	let output = '';

	// If we miss some zeros
	if (totalCharsInCurrentNumber < totalChars)
	{
		// Add corresponding number of zeros
		const missingZeros = ( totalChars - totalCharsInCurrentNumber );
		for (let i = 0; i < missingZeros; i ++)
		{
			output += placeholder;
		}
	}

	// Return formatted string
	return output + currentNumberAsString;
}

/**
 * Add or remove the trailing char at the end of a path.
 *
 * For ex:
 * - "/lib/test" becomes "/lib/test/" if add is true
 * - "/lib/test/" becomes "/lib/test" if add is false
 *
 * @param source String path with or without trailing char
 * @param add Will add char or remove slash.
 * @param char Default is a slash ( / ) but can be changed
 * @returns patched source with or without trailing char
 */
export function trailing (source:string, add = true, char = '/'):string
{
	// If we currently have a trailing char
	const hasTrailingSlash = ( source.lastIndexOf( char ) == source.length - 1 );

	// If we have to add trailing char
	if (add && !hasTrailingSlash)
	{
		return source + char;
	}

	// If we have to remove trailing char
	else if (!add && hasTrailingSlash)
	{
		return source.substr(0, source.length - 1);
	}

	// Do nothing
	else return source;
}

/**
 * Add or remove the leading char at the start of a path.
 *
 * For ex:
 * - "lib/test/" becomes "/lib/test/" if add is true
 * - "/lib/test/" becomes "lib/test/" if add is false
 *
 * @param source String path with or without leading char
 * @param add Will add char or remove char.
 * @param char Default is a slash ( / ) but can be changed
 * @returns patched source with or without leading char
 */
export function leading (source:string, add = true, char = '/'):string
{
	// If we currently have a leading char
	const hasLeadingSlash = ( source.indexOf( char ) == 0 );

	// If we have to add leading char
	if ( add && !hasLeadingSlash )
		return char + source;

	// If we have to remove leading char
	else if ( !add && hasLeadingSlash )
		return source.substr(1, source.length);

	// Do nothing
	else return source;
}

/**
 * Good old nl2br from PHP...
 * http://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript
 * @param value String in which we replace line breaks by <br> tags
 * @param breakTag <br> tag can be changed
 * @returns {string}
 */
export function nl2br (value:string, breakTag = '<br>')
{
	return (value + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

/**
 * Create a specified number of char in a string. Default are spaces.
 */
export function repeat ( total:number, char:string = ' ' ) {
	let buffer = '';
	for ( let i = 0; i < total; i ++ ) buffer += char;
	return buffer
}

/**
 * Indent with tabs or spaces. Will repeat a tab or space char.
 * Set tabSize to 0 (default) to indent with tabs
 * Set tabSize to any int > 0 to indent with spaces
 * @param total Number of tab to indent
 * @param content Content to add after indentation
 * @param tabSize 0 to indent with tabs, any int to indent with spaces
 */
export function indent ( total:number, content = '', tabSize = 0 ) {
	const indentation = tabSize == 0 ? repeat( total, "	" ) : repeat( total * tabSize, " " )
	return indentation + content
}

// ----------------------------------------------------------------------------- CASE

/**
 * First letter capital on given string.
 * For ex: "courgette? Oui!" become "Courgette, Oui!"
 */
export function upperCaseFirst ( source:string):string
{
	return source.substr(0, 1).toUpperCase() + source.substr(1, source.length);
}

/**
 * First letter in low case on given string.
 * For ex: "Fromage? Oui!" become "fromage? Oui!"
 */
export function lowerCaseFirst ( source:string):string
{
	return source.substr(0, 1).toLowerCase() + source.substr(1, source.length);
}

/**
 * Convert a dash case formatted string to a camel case format.
 *
 * Ex: "my-string" will be converted to "myString"
 */
export function dashToCamelCase (source:string, separator = '-'):string
{
	// Seperate dashs
	const split = source.toLowerCase().split(separator);
	const total = split.length;

	// Return raw if it's not a dash
	if (total < 2) return source.toLowerCase();

	// The first is not uppercase
	let out = split[0];

	// Others are upper cased first
	for ( let i = 1; i < total; i ++ )
		out += (i == 0 ? split[i] : upperCaseFirst( split[i]) );

	return out;
}

/**
 * Convert camelCase to dash_case or dash-case or DASH_CASE and even DASH-CASE
 * @param source camelCase string
 * @param separator Used separator between words. Default is dash -
 * @param upperCase If we have to uppercase every words. Default is no thanks.
 * @returns {string} dash-case-string or dash_case_string
 */
export function camelToDashCase (source:string, separator = '-', upperCase = false):string
{
	return leading(source.replace(
		/([A-Z])/g,
		( part:string ) => (
			separator + ( upperCase ? part.toUpperCase() : part.toLowerCase() )
		)
	), false, '-');
}

// ----------------------------------------------------------------------------- SLUGS

/**
 * Convert a string to be URL compatible.
 * Will replace spaces by dashes and remove capital case.
 * Will not convert special characters or repeating chars.
 */
export function quickSlug (content:string) {
	return content.toLowerCase().replace(/\s+/gi, '-');
}

/**
 * Converting ASCII special chars to slug regular chars (ex: 'héhé lol' is converted to 'hehe-lol')
 * Handy for URLs
 */
const SLUG_REGEX = [{
	regex: /[\xC0-\xC6]/g,
	char: 'A'
}, {
	regex: /[\xE0-\xE6]/g,
	char: 'a'
}, {
	regex: /[\xC8-\xCB]/g,
	char: 'E'
}, {
	regex: /[\xE8-\xEB]/g,
	char: 'e'
}, {
	regex: /[\xCC-\xCF]/g,
	char: 'I'
}, {
	regex: /[\xEC-\xEF]/g,
	char: 'i'
}, {
	regex: /[\xD2-\xD6]/g,
	char: 'O'
}, {
	regex: /[\xF2-\xF6]/g,
	char: 'o'
}, {
	regex: /[\xD9-\xDC]/g,
	char: 'U'
}, {
	regex: /[\xF9-\xFC]/g,
	char: 'u'
}, {
	regex: /[\xC7-\xE7]/g,
	char: 'c'
}, {
	regex: /[\xD1]/g,
	char: 'N'
}, {
	regex: /[\xF1]/g,
	char: 'n'
}
];

/**
 * Converting a string for URL's.
 * For ex : "I'm a robot" will be converted to "im-a-robot"
 */
export function slugify (input:string):string
{
	// Replace all non URL compatible chars
	const total = SLUG_REGEX.length;
	for (let i = 0; i < total; i ++)
	{
		input = input.replace(SLUG_REGEX[i].regex, SLUG_REGEX[i].char);
	}

	return (
		input.toLowerCase()
		.replace(/\s+/g, '-')           // Replacing spaces by dashes
		.replace(/[^a-z0-9-]/g, '')     // Deleting non alphanumeric chars
		.replace(/\-{2,}/g, '-')        // Deleting multiple dashes
		.replace(/^\-+|\-+$/g, '')		// Remove leading and trailing slashes
	);
}

// ----------------------------------------------------------------------------- PARSE

/**
 * Will parse a query string like this :
 * test=myValue&varName=otherValue
 * to this
 * {test: 'myValue', varName: 'otherValue'}
 * No double declaration checking, no nesting, no number parsing.
 * Will start after first ? or first # if found.
 * @param queryString The query string to parse
 * @returns Associative object with parsed values
 */
export function parseQueryString (queryString:string):ScalarObject
{
	// Start parsing after first ? or first # if detected
	['?', '#'].map( q =>
	{
		// Detect position of starter and split from it if detected
		const pos = queryString.indexOf( q );
		if ( pos !== -1 )
			queryString = queryString.substr( pos + 1, queryString.length );
	});

	// Convert number in strings to number
	const parseNumberValue = pValue => (
		( isNumber( pValue ) )
		? parseFloat( pValue )
		: pValue
	);

	// TODO : Ajouter le parsing de "true" / "false" ... et étendre ça a des helpers sur StringUtils

	// Split every & and browse
	const outputVarBag = {};
	queryString.split('&').map( couples =>
	{
		// Split on all =
		const splitted = couples.split('=', 2);

		// If there is an =, this is a key/value
		outputVarBag[ decodeURIComponent( splitted[0] ) ] = (
			( splitted.length === 2 )
			// Try to parse number from strings
			? parseNumberValue( decodeURIComponent( splitted[1] ) )
			// Otherwise, this is just a flag, we put it to true
			: true
		);
	});
	return outputVarBag;
}

// ----------------------------------------------------------------------------- UNTAB

/**
 * Count how many times a char is repeated at line start.
 * Default char tested is tab, to detect indentation
 */
export function countStartingChars ( line:string, char = "	" ):number
{
	let caret = 0
	while ( caret < line.length ) {
		if ( line.charAt(caret) != char )
			break
		caret ++
	}
	return caret
}

/**
 * Remove tabs from a template string.
 * FIXME : More doc
 * FIXME : Does not work perfectly, if improve, keep compatibility with cli libs
 */
export function untab ( content:string, level:"last"|"auto"|number = "last" ):string
{
	const lines = content.split("\n");

	let totalTabsToRemove:number = 0;

	if ( typeof level === 'number' )
		totalTabsToRemove = level;

	else if ( level === 'last' )
		totalTabsToRemove = countStartingChars( lines[ lines.length - 1 ] ) - 1;

	else if ( level === 'auto' )
	{
		totalTabsToRemove = -1;
		lines.map( (line, i) => {
			if ( i == 0 ) return;
			const count = countStartingChars( line );
			totalTabsToRemove = (
				totalTabsToRemove == -1 ? count
					: Math.min( totalTabsToRemove, count )
			);
		});
	}

	totalTabsToRemove = Math.max(0, totalTabsToRemove);

	const regex = new RegExp(`\n(\\t){${totalTabsToRemove}}`, 'gmi');
	//console.log('->', level, totalTabsToRemove, regex);
	return content.replace( regex, "\n" );
}

