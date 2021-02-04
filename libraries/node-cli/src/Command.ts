import { ScalarObject } from "@solid-js/core";
const path = require('path');


export type TCommandHandler = ( cliArguments?:string[], cliOptions?:ScalarObject, commandName?:string ) => any|Promise<any>

export type TCommandDefaultHandler = ( commandName:string, error:CommandError, cliArguments:string[], cliOptions?:ScalarObject, results?:any[] ) => any|Promise<any>

// Custom CommandError to be able to detect commands not found
class CommandError extends Error { }


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
export function getCLIRoot () {
	return (
		process.argv.length > 1
		? path.dirname( process.argv[1] )
		: process.cwd()
	);
}

// Cached args and options
let _argsAndOptionsCache;

/**
 * Get parsed arguments from CLI.
 * Results are in cache.
 * As a tuple : [ arguments, options ]
 * Ex :
 */
export function getCLIArguments () : [string[], ScalarObject]
{
	// Parse and put to cache
	if ( !_argsAndOptionsCache ) {
		const mri = require('mri');
		const argv = process.argv.slice(2);
		const parsedArgs = mri( argv );

		// Separate arguments and options
		const args = parsedArgs._ ?? [];
		delete parsedArgs._;
		_argsAndOptionsCache = [args, parsedArgs]
	}


	// Return cached as a tuple
	// [ arguments, options ]
	return _argsAndOptionsCache
}

// ----------------------------------------------------------------------------- CLI COMMANDS

// All parsed args and list of commands
let _registeredCommands = {};

export const CLICommands = {

	/**
	 * Register a command.
	 * Will replace if command name already exists.
	 * Use CLICommands.exists( commandName ) to avoid override.
	 *
	 * @param name Name of the command or list of commands.
	 * @param handler Handler called with options as first argument.
	 * @param options Default options of the command.
	 */
	add ( name:string|string[], handler:TCommandHandler, options:ScalarObject = {} )
	{
		(typeof name === "string" ? [name] : name).map( n => {
			n = n.toLowerCase();
			const alreadyRegisteredConfig = (
				n in _registeredCommands ? _registeredCommands[ n ] : {}
			);

			_registeredCommands[ n ] = {
				name: n,
				options: {
					...(alreadyRegisteredConfig.options ?? {}),
					...options
				},
				handlers: [
					...(alreadyRegisteredConfig.handlers ?? []),
					handler
				],
				help: alreadyRegisteredConfig.help ?? {}
			};
		})
	},

	/**
	 * TODO DOC
	 * @param name
	 * @param group
	 * @param message
	 * @param options
	 */
	addHelp ( name:string|string[], group:string, message:string, options : {[index:string] : string} = {})
	{
		( typeof name === "string" ? [name] : name ).map( n => {
			n = n.toLowerCase();
			if ( !( n in _registeredCommands) ) return; // fixme : error ?
			_registeredCommands[ n ].help = { group, message, options };
		});
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
	async start ( defaultHandler?:TCommandDefaultHandler )
	{
		// Get arguments from CLI
		const [ cliArguments, cliOptions ] = getCLIArguments();

		let commandName = ''
		let results = [];
		let error:CommandError = null;

		// If we have a command to start
		if ( cliArguments.length > 0 )
		{
			// Get command name
			commandName = cliArguments[0].toLowerCase();

			// Remove command name from _ args
			cliArguments.shift();

			// Try to run
			try {
				results = await this.run( commandName, cliArguments, cliOptions );
			}
			catch ( e ) {
				// Start default handler if command has not been found
				if ( e instanceof CommandError )
					error = e;
			}
		}

		// Call default handler
		if ( defaultHandler )
			await defaultHandler( commandName, error, cliArguments, cliOptions, results );
	},

	/**
	 * Run any registered command.
	 * Will make a loose check if command not found
	 * ( will accepted command starting with commandName )
	 * @param commandName Lowercase command name.
	 * @param cliArguments List of arguments passed to CLI
	 * @param cliOptions List of options passed to CLI, with defaults
	 * @returns {Promise<*>}
	 */
	async run ( commandName, cliArguments, cliOptions )
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
		const results = [];
		// console.log('--', command.handlers);
		for ( const handler of command.handlers ) {
			results.push(
				await handler(cliArguments, {
					...command.options,
					...cliOptions
				}, command.name)
			);
		}
		return results;
	},

	showHelp ()
	{
		// TODO : Show nice help
	},

	promptAvailableCommands ()
	{
		// TODO : Show all available commands in a selectable list
	}
};

