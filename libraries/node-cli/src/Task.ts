import chalk from "chalk";
import { indent, repeat } from "@solid-js/core";
import { cliTabSize } from "./Output";

// NOTE : DEMO
// (async function () {
//
// 	await runTask('Building', async (task:ITask) => {
//
// 		// Long task ...
//
// 		task.progress(12, 20)
// 		task.error();
// 	})
// })

// ----------------------------------------------------------------------------- STRUCT

export interface ITaskConfig
{
	message : string
	icon 	?: string
	dots 	?: string
}

export interface ITask
{
	success 	: ( newText?:string ) => void,
	error 		: ( code?:number, errorObject? ) => void,
	progress 	: ( current:number, total:number, afterProgress?:string, width?:number) => void,
	custom		: (state:boolean, bold:boolean, clearOverflow?:boolean, newText?:string ) => void
}

export type ITaskHandler<G> = ( task:ITask ) => G

// ----------------------------------------------------------------------------- TASK IN A PROMISE

/**
 * Run a task wrapped in a promise.
 * @param configOrMessage Task config object or task name as string.
 * @param taskHandler Async handler with task object as first argument.
 */
export function runTask <G> ( configOrMessage:ITaskConfig|string, taskHandler?:ITaskHandler<G> ) : G
{
	const taskObject = createTask( configOrMessage );
	return taskHandler( taskObject );
}

// ----------------------------------------------------------------------------- TRY TASK

/**
 * Try catch an async function wrapped in a task.
 * Will fail or succeed automatically depending of promise resolve or reject.
 * @param configOrMessage Message as string or task config (ITaskConfig)
 * @param taskHandler Async Handler to test.
 */
export async function tryTask <G> ( configOrMessage:ITaskConfig|string, taskHandler?:ITaskHandler<G> ) : Promise<G|void>
{
	const taskObject = createTask( configOrMessage );
	try {
		const result = await taskHandler( taskObject );
		taskObject.success()
		return result;
	}
	catch (e) {
		taskObject.error(
			e?.code ?? 0,
			e?.message ?? 'Error'
		)
	}
}

// ----------------------------------------------------------------------------- CREATE TASK

// Task counter for recursive tasks indentation
let totalTasks = 0;

// Used ascii chars codes to show symbols
const asciiChars = ['➤', '✔', '✘', '█', '░'];

/**
 * Create a task object.
 * @param configOrMessage Task config object or task name as string.
 */
export function createTask ( configOrMessage:ITaskConfig|string ):ITask
{
	configOrMessage = ( typeof configOrMessage === 'string' ? { message: configOrMessage } : configOrMessage );
	const config:ITaskConfig = {
		icon: asciiChars[0],
		dots: '...',
		...configOrMessage
	};

	const taskIndent = indent( totalTasks, '', cliTabSize )
	totalTasks ++;

	// Function to build a state message
	const buildMessage = ( state, bold, c = config.message ) => `${taskIndent} ${state}  ${bold ? chalk.bold(c) : c}`;

	// Build and store working to know where to print after
	const workingMessage = buildMessage(config.icon, true);

	// Show task line starting with an arrow and with trailing dots
	process.stdout.write( workingMessage + config.dots );

	// Number of char to clear after message
	let overflowToClear = config.dots.length;

	// Update task line state
	function updateState ( state, bold = false, clearOverflow = true, newText = config.message )
	{
		// Remove arrow and replace by step ASCII if defined
		if ( state )
		{
			if ( clearOverflow )
			{
				// Clear all line
				process.stdout.cursorTo ? process.stdout.cursorTo( 0 ) : process.stdout.write("\n");
				process.stdout.write( repeat(workingMessage.length + overflowToClear) );
			}

			// Build new state
			process.stdout.cursorTo ? process.stdout.cursorTo( 0 ) : process.stdout.write("\n");
			process.stdout.write( buildMessage(state, bold, newText ) );
		}

		// Go to new line
		exports.newLine();
	}

	let previousAfterProgress = null;

	/**
	 * Show a percentage bar next to the task name
	 * @param current Current value
	 * @param total Total value to compare current value with ( 1 and 10 will make 10 percent )
	 * @param afterProgress Update text after the progress bar
	 * @param width Bar width. Default is 30px
	 */
	function updateProgress ( current, total, afterProgress = null, width = 30 )
	{
		// Set overflow to clear from bar width
		overflowToClear = Math.max(overflowToClear, width + 2);

		// Create the bar from two chars
		let output = '';
		for (let i = 0; i < width; i ++)
			output += ( current / total > i / width ) ? '█' : '░';

		// Write progress bar
		process.stdout.cursorTo ? process.stdout.cursorTo( 0 ) : process.stdout.write("\n");
		process.stdout.write( workingMessage + '  ' + output );

		if (afterProgress)
			process.stdout.write( ' ' + afterProgress );

		if ( afterProgress && previousAfterProgress )
			process.stdout.write( repeat(Math.max(0, previousAfterProgress.length - afterProgress.length), ' ') );

		previousAfterProgress = afterProgress;
	}

	/**
	 * Remove trailing dots and replace arrow by a red error  mark
	 * @param code Halt if there is an error code ( > 0 )
	 * @param errorObject Will try to show error object in std
	 */
	function updateErrorState ( code = 0, errorObject = null )
	{
		// Update with an error mark
		updateState( chalk.red(asciiChars[2]), true, false );

		// Try to show error
		if ( errorObject != null )
		{
			// Add a line separator for errors
			exports.newLine();

			// In red if this is a string
			if ( typeof errorObject === 'string' )
			{
				console.error( exports.offset(6, chalk.red.bold( errorObject ) ) );
				exports.newLine();
			}

			// stdout and stderr if an exec error
			else if ( errorObject.stdout != null )
			{
				const stderr = (errorObject.stderr || '').toString();
				const stdout = (errorObject.stdout || '').toString();
				stderr && console.error( stderr );
				stdout && console.log( stdout );
			}

			// Error object
			else if ( errorObject instanceof Error )
				console.error( errorObject.message );

			// Or just try to log it
			else console.error( JSON.stringify(errorObject) )
		}

		totalTasks --;

		// Halt if there is an error code
		code > 0 && process.exit( code );
	}

	function updateSuccessState ( newText?:string )
	{
		totalTasks --;
		updateState( chalk.green(asciiChars[1]), false, true, newText )
	}

	// Return an object to allow caller to control this task
	return {
		// Remove trailing dots and replace arrow by a green success mark
		success     : updateSuccessState,
		// Inject error controller
		error       : updateErrorState,
		// Percentage indicator
		progress    : updateProgress,
		// Custom char state update
		custom      : updateState,
	}
}

