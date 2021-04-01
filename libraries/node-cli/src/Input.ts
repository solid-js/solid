import { getCLIArguments } from "./Command";
import { nicePrint } from "./Output";
import { AnyHandler, ScalarObject } from "@solid-js/core";

// ----------------------------------------------------------------------------- STRUCT

type TShortcutOptions = {
	argumentIndex	:number
	shortcuts		:string[]
}

type TAskListOptions = TShortcutOptions & {
	defaultIndex	:number|string
}

type TAskInputOptions = TShortcutOptions &  {
	defaultValue	:any
	isNumber		:boolean
	notEmpty		:boolean
}

// ----------------------------------------------------------------------------- CLI COMMANDS

/**
 * Ask list of choices to CLI.
 * @param message Question asked to CLI. Can be nice printed (@see nicePrint)
 * @param choices List of available choices as an object with named keys. Value as "---" to add a separator.
 * @param options
 * 		  | argumentIndex : Index of argument to catch value from.
 * 		  | shortcuts : Accepted shortcuts for arguments. ex: ['type', 't'] for --type / -t
 * 		  | defaultIndex : Default choice index (number if choices is an array, key as string otherwise)
 */
export async function askList ( message:string, choices:ScalarObject|string[], options:Partial<TAskListOptions> = {} )
{
	// Init Inquirer and get CLI argument & options
	const Inquirer = require('inquirer');
	const [ cliArguments, cliOptions ] = getCLIArguments();

	const isNotSep = entry => !( typeof entry === 'string' && entry === '---' )

	// Get choices keys and values, from array or scalar object
	const choicesKeys = Object.keys( choices ).filter( isNotSep );
	const choicesValues = (Array.isArray( choices ) ? choices : Object.values( choices ))

	// Target keys to compare to arguments
	const argumentCompare = (Array.isArray( choices ) ? choices : choicesKeys).filter( isNotSep );

	// Default index is a string if choices is a scalar object
	if ( options.defaultIndex && !Array.isArray( choices ) )
		options.defaultIndex = choicesKeys.indexOf( options.defaultIndex as string );

	// Selected choice and index
	let selectedChoice = null;
	let selectedIndex = -1;

	// Check CLI options shortcuts if we have some
	options.shortcuts && options.shortcuts.map( shortcut => {
		// Do not continue if already selected or shortcuts is not in args
		if ( selectedChoice ) return;
		if ( !cliOptions[ shortcut ] ) return;

		// Convert received shortcut to lower case
		const lower = (cliOptions[ shortcut ] + '').toLowerCase();

		// Browse choices to get closer one
		argumentCompare.map( (choiceKey, i) => {
			if ( selectedChoice ) return;
			if ( choiceKey.toLowerCase().indexOf(lower) === -1 ) return;
			selectedIndex = i;
			selectedChoice = choiceKey;
		});
	});

	// Check CLI argument index
	if ( !selectedChoice && options.argumentIndex >= 0 && options.argumentIndex in cliArguments )
	{
		// Convert received shortcut to lower case
		const argShortcut = cliArguments[ options.argumentIndex ].toLowerCase();

		let indexCounter = -1;
		argumentCompare.map( (choiceKey, i) => {
			if ( selectedChoice ) return;
			if ( isNotSep(choicesValues[i]) ) indexCounter ++
			if ( choiceKey.toLowerCase().indexOf( argShortcut ) === -1 ) return;
			selectedIndex = indexCounter;
			selectedChoice = choiceKey
		});
	}

	// Return selected choice
	if ( selectedChoice )
		return [ selectedIndex, selectedChoice ];

	// Replace separators
	const choicesWithSeparators = choicesValues.map( entry => (
		isNotSep( entry ) ? entry : new Inquirer.Separator()
	));

	// No choice found in arguments, ask CLI
	const question = await Inquirer.prompt({
		message: nicePrint(message, {
			// untab: false,
			newLine: false,
			output: 'return'
		}),
		type: 'list', // fixme : allow config
		pageSize: 12, // fixme : allow config
		name: 'answer',
		choices: choicesWithSeparators,
		default: options.defaultIndex ?? null
	});

	// Get answer and its index
	const {answer} = question;
	selectedIndex = choicesValues.filter( isNotSep ).indexOf( answer );
	return [ selectedIndex, answer, choicesKeys[selectedIndex] ];
}

/**
 * Ask a free input to CLI.
 * Input can be string or number
 * @param message Question asked to CLI. Can be nice printed (@see nicePrint)
 * @param options
 * 		  | argumentIndex : Index of argument to catch value from.
 * 		  | shortcuts : Accepted shortcuts for arguments. ex: ['type', 't'] for --type / -t
 * 		  | isNumber : Force input to be a number. Returned value will be typed number and not string.
 * 		  | notEmpty : Will force input to be non empty string and not NaN if number. Will repeat until form is filled.
 * 		  | defaultValue : Default value if user just hit enter.
 * @returns {Promise<number|string>}
 */
export async function askInput ( message, options:Partial<TAskInputOptions> = {} )
{
	options = {
		isNumber: false,
		notEmpty: false,
		...options
	}

	// Init Inquirer and get CLI argument & options
	const Inquirer = require('inquirer');
	const [ args, argsOpts ] = getCLIArguments();

	// Selected input
	let selectedInput;

	// Browse all shortcuts
	options.shortcuts && options.shortcuts.map( shortcut => {
		// Do not continue if corresponding argument has been found
		if ( selectedInput ) return;

		// Check if argument is found and has correct type
		const argShortcut = argsOpts[ shortcut ];
		if ( typeof argShortcut === (options.isNumber ? 'number' : 'string') )
			selectedInput = argShortcut;
	});

	// Check CLI argument index
	if ( !selectedInput && options.argumentIndex >= 0 && options.argumentIndex in args ) {
		const argShortcut = args[ options.argumentIndex ];
		if ( typeof argShortcut === (options.isNumber ? 'number' : 'string') )
			selectedInput = argShortcut;
	}

	// Loop to repeat if not satisfied by answer
	while ( true )
	{
		// If input has not been found in arguments
		if ( !selectedInput ) {
			// Ask to CLI
			const question = await Inquirer.prompt({
				type: options.isNumber ? 'number' : 'input',
				name: 'answer',
				default: options.defaultValue,
				message: nicePrint(message, {
					// untab: false,
					newLine: false,
					output: 'return'
				})
			});

			// Convert type
			selectedInput = ( options.isNumber ? parseFloat( question.answer ) : question.answer );
		}

		// Detect not satisfying values
		if ( options.notEmpty && (options.isNumber ? isNaN(selectedInput) : selectedInput.length === 0) ) {
			selectedInput = false;
			nicePrint(`{b/r}Value needed as ${options.isNumber ? 'number' : 'string'}`);
		}
		// We can exit loop return value
		else break;
	}

	// Return selected input
	return selectedInput;
}
