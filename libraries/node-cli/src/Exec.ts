import * as child_process from "child_process";
import { ExecSyncOptions } from "child_process";

type TVerboseLevel = boolean|0|1|2|3;

// ----------------------------------------------------------------------------- EXEC UTILITIES

/**
 * Exec a command async and resolve stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * Options argument can be collapsed onto stdlevel argument.
 * @param command Command to execute.
 * @param verboseLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin.
 * @param options See child_process.exec options. Ignore to call and hide command's stdout.
 * @returns Promise with stdout if success, stderr if fail
 */
export const execAsync = ( command:string, verboseLevel:TVerboseLevel = 0, options:ExecSyncOptions = null ) => new Promise( (resolve, reject) =>
{
	// Call command with default options
	const childProcess = child_process.exec(
		command, options,
		( error, stdout, stderr) => {
			error
			? reject( (stderr ?? '').toString() )
			: resolve( (stdout ?? '').toString() )
		}
	);

	// Go to stdout
	if ( verboseLevel === true || verboseLevel === 1 || verboseLevel === 3 ) {
		// @ts-ignore
		childProcess.stdout.pipe( process.stdout );
	}

	// Go to stderr
	if ( verboseLevel === true || verboseLevel === 2 || verboseLevel === 3 ) {
		// @ts-ignore
		childProcess.stderr.pipe( process.stderr );
	}
});


/**
 * Exec a command and return stdout as string.
 * By default stdout and stderr are hidden.
 * Set stdLevel to show stdout and / or stderr.
 * Options argument can be collapsed onto stdlevel argument.
 * @param command Command to execute.
 * @param verboseLevel standard outputs to use. 0 is none, 1 is only stdout, 2 is only stderr, 3 is stdout and stdin.
 * @param options See child_process.execSync options. Ignore to call and hide command's stdout.
 * @returns Stringified result of command's stdout
 */
export function execSync ( command:string, verboseLevel:TVerboseLevel = 0, options:ExecSyncOptions = null ):string
{
	try {
		// Call command with default options
		let result = child_process.execSync( command, options );

		// Convert to string
		const resultString = (result ?? '').toString();

		// Go to stdout if needed
		if ( resultString && (verboseLevel === true || verboseLevel === 1 || verboseLevel === 3) )
			process.stdout.write( resultString );

		// Return string result
		return resultString;
	}
	catch ( error ) {
		const resultString = (error.stdout ?? '').toString();
		if ( verboseLevel === true || verboseLevel === 1 || verboseLevel === 3 )
			process.stdout.write( resultString );

		if ( verboseLevel === true || verboseLevel === 2 || verboseLevel === 3 )
			process.stderr.write( (error.stderr ?? '').toString() );

		// Return string result
		return resultString;
	}
}

