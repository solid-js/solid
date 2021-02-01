
// ----------------------------------------------------------------------------- EXEC UTILITIES

import { exec } from "child_process";

const stdLevels = [
	[0, null, null],
	[0, 1, null],
	[0, null, 1],
	[0, 1, 2]
];

const makeExecOptions = (stdLevel, options) => {
	return (
		typeof stdLevel === 'object'
			? stdLevel
			: {
				stdio: stdLevels[ stdLevel ] || 'pipe',
				env: process.env,
				...options
			}
	)
};

/**
 * Exec a command async and resolve stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * Options argument can be collapsed onto stdlevel argument.
 * @param command Command to execute.
 * @param stdLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin.
 * @param options See execSync options. Ignore to call and hide command's stdout.
 * @returns Promise with stdout if success, stderr if fail
 */
/*
exports.exec = async function ( command, stdLevel = 0, options )
{
	return new Promise( (resolve, reject) =>
	{
		// Call command with default options
		exec(
			command,
			makeExecOptions(stdLevel, options),
			( error, stdout, stderr) => {
				error
				? reject( (stderr || '').toString() )
				: resolve( (stdout || '').toString() )
			}
		);
	});
};*/

const execAsync = (command, verbose, options) => new Promise( (resolve, reject) =>
{
	const childProcess = exec(
		command, options,
		( error, stdout, stderr) => {
			error
			? reject( (stderr || '').toString() )
			: resolve( (stdout || '').toString() )
		}
	);

	if ( verbose === true || verbose === 1 || verbose === 3 )
		childProcess.stdout.pipe( process.stdout );
	if ( verbose === true || verbose === 2 || verbose === 3 )
		childProcess.stderr.pipe( process.stderr );
});


/**
 * Exec a command and return stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * Options argument can be collapsed onto stdlevel argument.
 * @param command Command to execute.
 * @param stdLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin
 * @param options See execSync options. Ignore to call and hide command's stdout.
 * @returns Stringified result of command's stdout
 */
exports.execSync = function ( command, stdLevel = 0, options )
{
	// Call command with default options
	const result = execSync(command, makeExecOptions(stdLevel, options));
	return result ? result.toString() : null;
};

