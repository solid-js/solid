// Import CLI utilities
const {task, table, newLine, test } = require('./cli');
const chalk = require('chalk');

// Some helpers to fake delays and get random integers
const randomDelay = async (size = 1) => new Promise( resolve => setTimeout(resolve, Math.random() * 1000 * size) );
const randInt = (max = 10) => Math.floor(Math.random() * max);

/**
 * Task utility demo
 */
async function taskDemo ()
{
    // Create and show our demo task
    const demoTask1 = task('Running things');

    // Wait a bit
    await randomDelay();

    // First line of data for table are labels
    let data = [
        ['File name', 'File size', 'Is a module']
    ];

    // Fake some loop
    const totalLines = randInt(5) + 4;
    for (let i = 0; i < totalLines; i ++)
    {
        // Show progress on task and wait a bit
        demoTask1.progress( i, totalLines );
        await randomDelay( .5 );

        // Push fake data to table
        data.push([`file-${randInt(999)}.js`, randInt(20000), Math.random() > .5]);
    }

    // Demo is a success
    demoTask1.success();

    // Colors last column on table
    data = data.map( (line, lineIndex) => line.map(
        (column, columnIndex) => {
            if (lineIndex === 0 || columnIndex !== 2) return column;
            return column ? chalk.green.bold( column ) : chalk.red.bold( column )
        })
    );

    // Show table with first line as labels
    newLine();
    table( data, true, [], '    ' );
}

/**
 * Unit test demo
 */
async function testDemo ()
{
    // Wait a bit
    await randomDelay();

    // New unit test
    await test('Running test', it =>
    {
        // Make some assertions which take some times to see the progress
        it('should take some time', async assert =>
        {
            await randomDelay(.4);
            assert(true);
        });
        it('should take some time', async assert =>
        {
            await randomDelay();
            assert(true);
        });
        it('should take some time', async assert =>
        {
            await randomDelay();
            assert(true);
        });
    });

    // Repeat ...
    await test('Other test', it =>
    {
        it('should take some time', async assert =>
        {
            await randomDelay(.3);
            assert(true);
        });

        it('should take some time', async assert =>
        {
            await randomDelay(.3);
            assert(true);
        });

        it('should take some time', async assert =>
        {
            await randomDelay(.3);
            assert(true);
        });
    });
}

/**
 * Fail task demo
 */
async function failDemo ()
{
    // Create a fake task
    const failTask = task('This will fail, eventually');
    for (let i = 0; i < 10; i ++)
    {
        // Show progress
        await randomDelay(.5);
        failTask.progress(i, 10);

        // And fail it
        // This will stop exec and exit with code 1
        if ( i > 7 )
            failTask.error(`Fatal error happened here !`, 1);
    }
}

// Run all demos
(async function ()
{
    newLine();
    await taskDemo();
    newLine();
    await testDemo();
    newLine();
    await failDemo();
    newLine();
})();
