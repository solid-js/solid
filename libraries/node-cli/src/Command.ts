import { ScalarObject } from "@solid-js/core";
const path = require('path');

// ----------------------------------------------------------------------------- ARGV

/**
 * Get base folder of executed node file.
 * Can be different than process.cwd()
 * Will fallback to process.cwd() if not found in argv.
 *
 * ex : cd project && node directory/file.js
 * 		cwd : "project/"
 * 		getProcessRoot : "project/directory/"
 *
 */
export function getProcessRoot () {
	return (
		process.argv.length > 1
		? path.dirname( process.argv[1] )
		: process.cwd()
	);
}

// Cached argvs
let _parsedArgs;

/**
 * Get parsed arguments from CLI.
 * Results are in cache.
 * As a tuple : [ arguments, options ]
 * Ex :
 */
export function getCLIArguments () : [string[], ScalarObject]
{
	// Parse and put to cache
	if ( !_parsedArgs ) {
		const mri = require('mri');
		const argv = process.argv.slice(2);
		_parsedArgs = mri( argv );
	}

	// Separate arguments and options
	const args = _parsedArgs._ ?? [];
	delete _parsedArgs._;

	// Return cached as a tuple
	// [ arguments, options ]
	return [args, _parsedArgs]
}

// ----------------------------------------------------------------------------- CLI COMMANDS

export type TCommandHandler = (args?:string[], options?:ScalarObject, commandName?:string) => any|Promise<any>

// All parsed args and list of commands
let _registeredCommands = {};

// Custom CommandError to be able to detect commands not found
class CommandError extends Error { }

export const CLICommands = {

	/**
	 * Register a command.
	 * Will replace if command name already exists.
	 * Use CLICommands.exists( commandName ) to avoid override.
	 *
	 * @param name Name of the command or list of commands.
	 * @param options Default options of the command.
	 * @param handler Handler called with options as first argument.
	 */
	add ( name:string|string[], options:ScalarObject, handler:TCommandHandler )
	{
		(typeof name === "string" ? [name] : name).map( n => {
			_registeredCommands[ n.toLowerCase() ] = {
				name: n,
				options,
				handler
			};
		})
	},

	/**
	 * Get registered commands list
	 */
	list () {
		return Object.keys( _registeredCommands );
	},

	/**
	 * Check if a command exists
	 */
	exists ( commandName:string ) {
		return Object.keys( _registeredCommands ).indexOf( commandName ) !== -1
	},

	/**
	 * Start parsing arguments and run command with options
	 * @param defaultHandler Called when command has not been found.
	 * @returns {Promise<void>}
	 */
	async start ( defaultHandler )
	{
		// If we await for a command, askMenu need to catch next argument
		//menuIndex ++;

		// Get arguments from CLI
		const [ args, options ] = getCLIArguments();

		// If we have a command to start
		if ( args.length > 0 )
		{
			// Get command name
			const commandName = args[0].toLowerCase();

			// Remove command name from _ args
			args.shift();

			// Try to run
			try {
				await this.run( commandName, args, options );
			}
			catch ( e )
			{
				// Start default handler if command has not been found
				if ( e instanceof CommandError && defaultHandler )
					await defaultHandler( commandName, args, options );
			}
		}

		// No command found, call default handler with empty command as argument
		else if ( defaultHandler )
			await defaultHandler( '', options );
	},

	/**
	 * Run any registered command.
	 * Will make a loose check if command not found
	 * ( will accepted command starting with commandName )
	 * @param commandName Lowercase command name.
	 * @param args List of arguments passed to CLI
	 * @param options List of options passed to CLI, with defaults
	 * @returns {Promise<*>}
	 */
	async run ( commandName, args, options )
	{
		// Throw if command does not exists
		let selectedCommand;
		if ( commandName in _registeredCommands )
			selectedCommand = commandName;

		else
		{
			// Try loose check
			Object.keys( _registeredCommands ).map( command => {
				// Do not continue if we found
				if ( selectedCommand ) return;

				// Check loose (starting like) and with lowercase check
				if ( command.toLowerCase().indexOf( commandName.toLowerCase() ) === 0 )
					selectedCommand = commandName
			});

			// Not found, even with loose, we throw
			if ( !selectedCommand )
				throw new CommandError('Command not found');
		}

		// Get command
		const command = _registeredCommands[ selectedCommand ];

		// Execute command with options on top of default options
		return await command.handler(args, {
			...command.options,
			...options
		}, command.name);
	}
};

