
// ----------------------------------------------------------------------------- ARGV

// Cached argvs
let _parsedArgs;

/**
 * Get parsed arguments from CLI.
 * Results are in cache.
 */
exports.getArguments = function ()
{
	// Parse and put to cache
	if ( !_parsedArgs )
	{
		const mri = require('mri');
		const argv = process.argv.slice(2);
		_parsedArgs = mri( argv );
	}

	// Return cached
	return _parsedArgs;
};


// ----------------------------------------------------------------------------- CLI COMMANDS

// All parsed args and list of commands
let _registeredCommands = {};

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
		_registeredCommands[name.toLowerCase()] = {
			options: optionsOrHandler,
			handler
		};
	},

	/**
	 * Get registered commands list
	 */
	list ()
	{
		return _registeredCommands;
	},

	/**
	 * Start parsing arguments and run command with options
	 * @param defaultHandler Called when command has not been found.
	 * @returns {Promise<void>}
	 */
	async start ( defaultHandler )
	{
		// If we await for a command, askMenu need to catch next argument
		menuIndex ++;

		// Get arguments from CLI
		const args = exports.getArguments();

		// If we have a command to start
		if ( args._.length > 0 )
		{
			// Get command name
			const commandName = args._[0].toLowerCase();

			// Remove command name from _ args
			args._.shift();
			if (args._.length ===  0)
				delete args._;

			// Try to run
			try
			{
				await this.run( commandName, args);
			}
			catch ( e )
			{
				// Start default handler if command has not been found
				if ( e instanceof CommandError && defaultHandler )
					await defaultHandler( commandName );
			}
		}

		// No command found, call default handler with empty command as argument
		else if ( defaultHandler )
			await defaultHandler( '' );
	},

	/**
	 * Run any registered command.
	 * Will make a loose check if command not found
	 * ( will accepted command starting with commandName )
	 * @param commandName Lowercase command name.
	 * @param options Options to override from command's default options
	 * @returns {Promise<*>}
	 */
	async run ( commandName, options )
	{
		// Throw if command does not exists
		let selectedCommand;
		if ( commandName in _registeredCommands )
			selectedCommand = commandName;
		else
		{
			// Try loose check
			_registeredCommands.map( command =>
			{
				// Do not continue if we found
				if ( selectedCommand ) return;

				// Check loose (starting like) and with lowercase check
				if ( command.toLowerCase().indexOf( commandName.toLowerCase() ) === 0 )
					selectedCommand = commandName
			});

			// Not found, even with loose, we throw
			if (!selectedCommand) throw new CommandError('Command not found');
		}

		// Get command
		const command = _registeredCommands[ selectedCommand ];

		// Execute command with options on top of default options
		return await command.handler({
			...command.options,
			...options
		});
	}
};

