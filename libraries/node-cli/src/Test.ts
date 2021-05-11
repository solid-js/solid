import { createTask, ITask } from "./Task";
import { compareWithOperator, repeat, TCompareOperators } from "@solid-js/core"
import chalk from "chalk";
import { newLine } from "./Output";

// ----------------------------------------------------------------------------- RUN TEST

// If there is a running test, added tests will not start
let runningTest = false;

// List of waiting tests
const waitingTests = [];

/**
 * Run a test
 * @param name Name of the test / task
 * @param testHandler Called to initialize test
 */
async function runTest ( name:string, testHandler ) : Promise<void>
{
	// Tests are running now, put new tests in waiting line
	runningTest = true;

	// Current assertion index is starting at minus one because we start with increment in doNextAssertion
	let currentAssertIndex = -1;

	// All registered assertions and "it" methods
	const allAssertions = [];
	const it = ( should, handler ) => allAssertions.push({ should, handler });

	// Start task in CLI
	const task:ITask = createTask( 'Test ' + name );

	// Call test initialization handler to have assertions list
	await testHandler( it );

	// If we had any failure in this testing
	// Used to stop all others tests if any fails
	let hadError = false;

	// Compute next assertion for this test
	async function doNextAssertion ()
	{
		// Go to next assertion
		currentAssertIndex ++;

		// Do not continue if there are no more assertions to check
		if ( !(currentAssertIndex in allAssertions) ) return;

		// Update progress on task
		task.progress( currentAssertIndex, allAssertions.length );

		// Target current assertion to check
		const assertionResult = allAssertions[ currentAssertIndex ];

		// Here we try assertion as a promise
		try
		{
			// Create a new self-awaited promise
			await new Promise<void>( (resolve, reject) =>
			{
				// Call this "it" and pass assertion handler
				assertionResult.handler( (result, expectedValue = true, operator:TCompareOperators = '===') =>
					// When "assert" is called, we check here if assertion is true
					// If true, we resolve promise, otherwise promise fails
					compareWithOperator( result, expectedValue, operator )
					? resolve()
					: reject( {result, expectedValue, operator} )
				)
			})
		}
		// If there are any failed assertion
		catch ( e )
		{
			// We stop any further testing
			hadError = true;

			// Set task cli as error state
			task.error();

			// Show error message
			newLine();
			console.error( repeat( 6 ) + chalk.redBright.bold(`${name} failed at :`) )
			console.error( repeat( 6 ) + chalk.bold(`It ${assertionResult.should}.`))
			newLine();

			// Show values
			console.error( repeat( 6 ) + `Received value : ${chalk.bold(e.result)}` )
			console.error( repeat( 6 ) + `Expected value : ${chalk.bold(e.awaitedValue)}` )
			console.error( repeat( 6 ) + `With operator : ${chalk.bold(e.operator)}` )
			newLine();

			// Stop process here
			process.exit( 1 );
		}

		// Continue to next assertion if there were no failure
		if ( !hadError ) await doNextAssertion();
	}

	// Start with first assertion
	await doNextAssertion();

	// All assertions are ok, update cli state
	task.success();

	// If we still have waiting tests
	if ( waitingTests.length > 0 )
	{
		// Target next test and do it
		const nextTest = waitingTests.shift();
		runTest( nextTest.name, nextTest.testHandler );
		return;
	}

	// All tests are done now
	runningTest = false;
}

/**
 * Create and declare a new Unit test.
 * Will wait previous test to finish to start new ones.
 * @param name Name of unit test to run. Will show in CLI.
 * @param testHandler Function with "it" parameter to declare list of assertions.
 */
export async function test ( name, testHandler )
{
	// Put in waiting line if test are already running
	if ( runningTest )
		waitingTests.push({ name, testHandler });

	else await runTest( name, testHandler );
}

