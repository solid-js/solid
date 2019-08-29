import {execSync} from "child_process";
import chalk from "chalk";

/**
 * Log a bold line in CLI
 */
export function log ( message, noBold, noLine )
{
    const content = noBold ? message : chalk.bold( message );
    noLine ? process.stdout.write( content ) : console.log( content );
}

/**
 * TODO DOC
 * @param message
 * @returns
 */
export function task ( message )
{
    // Show task line starting with an arrow and with trailing dots
    process.stdout.write( `➤  ${chalk.bold(message)} ... ` );

    // Go to next line
    const newLine = () => process.stdout.write('\r\n');

    // Update task line state
    function updateState ( state )
    {
        // Remove arrow and replace by step ASCII if defined
        if ( state )
        {
            process.stdout.cursorTo( 0 );
            process.stdout.write( `${state} ` );
        }

        // Remove trailing dots and go to next line
        process.stdout.cursorTo( message.length + 4 );
        process.stdout.write('   ');
        newLine();
    }

    /**
     * Remove trailing dots and replace arrow by a red error  mark
     * @param errorObject Will try to show error object in std
     * @param code Halt if there is an error code ( > 0 )
     */
    function error ( errorObject, code = 0 )
    {
        // Update with an error mark
        updateState( chalk.red('✘') );

        // Try to show error
        if ( errorObject != null )
        {
            // In red if this is a string
            if ( typeof errorObject === 'string' )
            {
                console.error(chalk.red.bold( errorObject ))
            }

            // stdout and stderr if an exec error
            else if ( errorObject.stdout != null )
            {
                const stderr = errorObject.stderr.toString();
                const stdout = errorObject.stdout.toString();
                stderr && console.error( stderr );
                stdout && console.log( stdout );
            }

            // Or just try to log it
            else console.log( errorObject );
        }

        // Halt if there is an error code
        code > 0 && process.exit( code );
    }

    // Return an object to allow caller to control this task
    return {
        // End task. Keep arrow but remove trailing dots
        end     : () => updateState( chalk.green() ),
        // Remove trailing dots and replace arrow by a green success mark
        success : () => updateState( chalk.green('✔') ),
        // Custom char state update
        custom  : state => updateState( state ),
        // Inject error controller
        error
    }
}

/**
 * Halt with an error message
 */
export function halt ( str = null, code = 1 )
{
    str && console.error(chalk.red.bold( str ));
    str && console.error('');
    process.exit( code );
}

/**
 * Exec a command and return stdout as string.
 */
export function exec ( command, options )
{
    const result = execSync(command, (
        options === true
        ? { stdio: [1, 2] }
        : options
    ));
    return result ? result.toString() : null;
}