
// ----------------------------------------------------------------------------- CLI COMMANDS

// Current menu index to get correct argv._
let menuIndex = -1;

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
exports.askMenu = async function ( message, entries )
{
	const Inquirer = require('inquirer');
	const args = exports.getArguments();

	// Go to the next menu index
	menuIndex ++;

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

	// Convert to Inquirer list of choices (array of names + separators if not a object with a title )
	const choices = entries.map( scaffolder => scaffolder.title || new Inquirer.Separator() );

	// Ask question
	const question = await Inquirer.prompt({
		type: 'list',
		name: 'answer',
		pageSize: 20,
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
};

/**
 * Ask list of choices to CLI.
 * @param message Question asked to CLI
 * @param choices List of available choices, as an array of strings.
 * @param shortcuts Accepted shortcuts for arguments. ex: ['--type', '-t']
 * @returns {Promise<string|number>}
 */
exports.askList = async function ( message, choices, shortcuts )
{
	const Inquirer = require('inquirer');
	const args = exports.getArguments();

	// Selected choice
	let selectedChoice;

	// Check shortcuts if we have some
	shortcuts && shortcuts.map( shortcut =>
	{
		// Do not continue if already selected or shortcuts is not in args
		if ( selectedChoice ) return;
		if ( !args[shortcut] ) return;

		// Convert received shortcut to lower case
		const lower = args[ shortcut ].toLowerCase();

		// Browse choices to get closer one
		choices.map( choice =>
		{
			if ( selectedChoice ) return;
			if ( choice.toLowerCase().indexOf(lower) === -1 ) return;
			selectedChoice = choice;
		});
	});

	// Return selected choice
	if ( selectedChoice ) return selectedChoice;

	// No choice found in arguments, ask CLI
	const question = await Inquirer.prompt({
		type: 'list',
		name: 'answer',
		message,
		choices
	});
	return question.answer;
};

/**
 * Ask a free input to CLI.
 * Input can be string or number
 * @param message Question asked to CLI
 * @param shortcuts Accepted shortcuts for arguments. ex: ['--type', '-t']
 * @param isNumber Force input to be a number. Returned value will be typed number and not string.
 * @param notEmpty Will force input to be non empty string and not NaN if number. Will halt and stop process.
 * @param defaultValue Default value if user just hit enter.
 * @returns {Promise<number|string>}
 */
exports.askInput = async function ( message, shortcuts = [], isNumber = false, notEmpty = true, defaultValue = null )
{
	const Inquirer = require('inquirer');
	const args = exports.getArguments();

	// Browse all shortcuts
	let input;
	shortcuts && shortcuts.map( shortcut =>
	{
		// Do not continue if corresponding argument has been found
		if ( input ) return;

		// Check if argument is found and has correct type
		const argShortcut = args[ shortcut ];
		if ( typeof argShortcut !== (isNumber ? 'number' : 'string') ) return;
		input = argShortcut;
	});

	// If input has not been found in arguments
	if ( !input )
	{
		// Ask to CLI
		const question = await Inquirer.prompt({
			type: isNumber ? 'number' : 'input',
			name: 'answer',
			default: defaultValue,
			message
		});

		// Convert type
		input = ( isNumber ? parseFloat( question.answer ) : question.answer );
	}

	// Detect empty values and halt
	if ( notEmpty && (isNumber ? isNaN(input) : input.length === 0) )
	{
		const messageWithoutQuestionMark = message.split('?').join('').trim();
		exports.halt(`${messageWithoutQuestionMark} cannot be empty.`, 1, true);
	}

	// Return selected input
	return input;
};
