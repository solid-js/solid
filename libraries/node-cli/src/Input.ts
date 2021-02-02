import { getCLIArguments } from "./Command";
import { nicePrint } from "./Output";
import { AnyHandler, ScalarObject } from "@solid-js/core";


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

interface IAskMenuEntry
{
	title	: string
	handler	: AnyHandler
}

// ----------------------------------------------------------------------------- CLI COMMANDS

/**
 * Ask menu to user.
 * Entries need to be in this format :
 * [
 *   // Classic entry
 *   { title: "Menu entry" },
 *
 *   // a separator
 *   "---"
 *
 *   // Entry which call an action when selected
 *   { title: "Other menu entry", action: anyFunctionToCall },
 *
 *   // Allow selection from arguments shortcuts :
 *   // node my-script callAction
 *   { title: "With shortcut", shortcuts: ["callAction", "a"]}
 * ]
 *
 * Multiple askMenu can be aligned. Arguments will be gathered in order.
 *
 * @param message Question asked to CLI.
 * @param entries @see function signature to know more.
 * @returns {Promise<string|number>}
 */
/*
export async function askMenu ( message:string, entries:(IAskMenuEntry|string)[] )
{
	const Inquirer = require('inquirer');
	const [ cliArguments, cliOptions ] = getCLIArguments();

	// Check if there is an action for this menu index
	const currentMenuShortcut = args._[ menuIndex ] || null;
	if ( currentMenuShortcut )
	{
		// Browse all entries to get good action
		let selectedEntry;
		entries.map( entry =>
		{
			// Do not continue if shortcut is not corresponding
			if ( !entry.shortcuts ) return;
			if ( entry.shortcuts.indexOf( currentMenuShortcut.toLowerCase() ) === -1 ) return;

			// Selected entry ( for return statement bellow )
			selectedEntry = entry;

			// Call action if needed
			entry.action && entry.action();
		});
		return selectedEntry;
	}

	// Convert to Inquirer list of choices (array of names + separators
	const choices = entries.map( entry => typeof entry === 'string' ? new Inquirer.Separator() : entry );

	// Ask question
	const question = await Inquirer.prompt({
		type: 'list',
		name: 'answer',
		pageSize: 12,
		message,
		choices
	});

	// Get answer index and target selected entry
	const entryIndex = choices.indexOf( question.answer );
	const selectedEntry = entries[ entryIndex ];

	// Call action if needed
	selectedEntry.action && selectedEntry.action();

	// Return selected entry
	return selectedEntry;
}*/


/**
 * Ask list of choices to CLI.
 * @param message Question asked to CLI
 * @param choices List of available choices as an object with named keys. Value as "---" to add a separator.
 * @param options
 * 		  | argumentIndex : Index of argument to catch value from.
 * 		  | shortcuts : Accepted shortcuts for arguments. ex: ['type', 't'] for --type / -t
 * 		  | defaultIndex : Default choice index (number if choices is an array, key as string otherwise)
 * @returns {Promise<string|number>}
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
		message,
		type: 'list', // fixme : allow config
		pageSize: 12, // fixme : allow config
		name: 'answer',
		choices: choicesWithSeparators,
		default: options.defaultIndex ?? null
	});

	// Get answer and its index
	const {answer} = question;
	selectedIndex = choicesValues.filter( isNotSep ).indexOf( answer );
	return [ selectedIndex, answer ];
}

/**
 * Ask a free input to CLI.
 * Input can be string or number
 * @param message Question asked to CLI
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
				message
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
