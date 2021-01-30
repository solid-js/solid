# Solid Node CLI utilities

`@solid-js/cli` is a very simple node library to show small running tasks and messages in any terminal. 
Dependencies are [Chalk](https://www.npmjs.com/package/chalk) for text transforms and [mri](https://www.npmjs.com/package/mri) for argument parsing.
This lib uses [Inquirer](https://www.npmjs.com/package/inquirer) to manage user inputs.
We use [strip-ansi](https://www.npmjs.com/package/strip-ansi) to count chars even when stylised for CLI (removes bold or color markers from string).


![Solid CLI Demo](https://github.com/solid-js/solid/raw/master/libraries/node-cli/doc/solid-cli-demo.gif)

This gif is recorded from [demo.js](https://github.com/solid-js/solid/tree/master/libraries/node-cli/demo.js). 


### Installation

To install Nanostache in your Node project :<br>
```shell
npm install @solid-js/cli
```
or
```shell
yarn add @solid-js/cli
```


### Import

```javascript
const { createSpaces, print, offset, ... } = require('@solid-js/cli');
```

### Banner

Show a big old ASCII banner

```javascript
banner(title, width = 78, margin = 1, padding = 2);
```


### Print

Print some content to the `stdout`, with bold and same line options.
Set `newLine` to false to disable trailing `\n\r`. Useful if you need to append some texts on the same line after.

```javascript
print(content, bold = false, newLine = true);
```


### Offset

Returns an offset text with leading spaces.

```javascript
const offsetText = offset(3, 'My offset');
// '   My offset'
```

### New line

Write a new line to `stdout`

```javascript
newLine();
```

### Halt

Show a message in red and bold to `stderr`. Exit current process. Exit
code can be overridden, default exit code is 1.

```javascript
halt('This is a pretty big error')
```

### Exec

Run any shell command synchronously.

```javascript
// Sync version
const result = execSync('ls -la');
```

Wrap in try catch to get errors.

```javascript
let result;
try
{
    result = execSync('./custom-command.sh');
}
catch ( e )
{
    halt( e );
}
print( result );
```

```javascript
// Async version
try
{
    const stdout = await exec('ls -la');
}
catch ( e )
{
    // e === stderr
}
```


By default, `stdout` and `stderr` are hidden. To change this behavior,
Set stdLevel to :
- 0 (default) : No `stdout` and `stderr` are shown. Use return and try / catch to get them.
- 1 : Only `stdout` is shown
- 2 : Only `stderr` is shown
- 3 : Both `stdout` and `stderr` are shown

Know more about options :
- see [NodeJS exec options doc](https://nodejs.org/api/child_process.html#child_process_child_process_execsync_command_options))
- see [NodeJS stdio doc](https://nodejs.org/api/child_process.html#child_process_options_stdio)

```javascript
execSync('command');
// No stdout and stderr shown, use return and try / catch to get them
```

```javascript
const result = execSync('command', 2);
// Only stderr are shown. Stdin is in result
```

```javascript
// Setting custom options
execSync('command', 2, {
    cwd: 'otherDirectory/'
});
```

```javascript
// Options argument can be collapsed onto stdlevel argument.
execSync('command', {
    stdio: 'my super specific stdio'
});
```

### Task

```javascript
// Create and show a new task on CLI
const spriteTask = task('Building sprites');
// ➤ Building sprites ...
```

```javascript
// Set to success
spriteTask.success();
// ✔ Building sprites
```

```javascript
// Set to success with updated text
spriteTask.success(`Built ${ total } sprites`);
// ✔ Built 12 sprites
```


##### Task error

```javascript
task.error( errorObject, code = 0 );
```
First argument `errorObject` can be :
- null (will print nothing)
- a string
- an object containing stdout and stderr properties
- an error object

Second argument `code` will exit if `code > 0`. Note : `process.exit`
can be hooked with `hookStandards()`.

```javascript
// Set to error
spriteTask.error();
// ✘ Building sprites
```

```javascript
// Set to error, show message to stderr and exit process 
spriteTask.error( myError, 1 );
// ✘ Building sprites
// Error message
```

##### Task progress

Show a progress bar next to the current task. Width can be set, default
width is 30px.

```javascript
spriteTask.progress( 3, 12 ) // 3 per 12 is 3 / 12
// ✔ Building ██░░░░░░░░░░░░
```

```javascript
spriteTask.progress( 3, 3 ) // 3 per 3 is 1
// ✔ Building ██████████████
```

```javascript
spriteTask.progress( 1, 100, 50 ) // 1 per 100
// ✔ Building █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

##### Asynchronous task chaining

```javascript
await task('My task').run( async t => {
    // t is task instance so you can t.success or t.error if needed
    await stuff1();
    await stuff2();
    // If any error occurs, task will stop and show error
    // If everything is good, task will show success and promise will be resolved
});
```


### Table

Will show a nice table to the CLI

```javascript
const data = [
    ['File', 'Size', 'Is a module'],
    ['test.js', 534, true],
    ['other-file.js', 1535, false],
    ['data.js', 42, false],
    ['test.js', 534, true]
];
table( data, true ); // first line are labels
```

```javascript
// With some display options
table( data, firstLineAreLabels = false, minColumnWidths = [40, 20, 20], lineStart = ' ', lineEnd = '', separator = chalk.grey(' │ ');
```

```javascript
// Get column position to align some info bellow table.
// columnPositions has one item more than total number of columns (container table start and table end)
const columnPositions = table( data );
```

### Tests

```javascript
const { test } = require('@solid-js/cli');

test("My lib's feature", it =>
{
    // "It" is a function to declare list of assertions
    // Every "it" will add a progress bar to the current task
    // Every "it" can be sync or async it does not matter
    
    it('sould return 42', assert =>
    {
        // Here we call our tested method / lib
        const result = myLib.doStuff();
        
        // The assertion will fail if the result is not exactly 42
        assert( result, 42 );
    });
    
    it('sould throw error', assert => 
    {
        // We try error throw for example here
        // Assertion will fail if our lib does not throw expected error
        try
        {
            myLib.doStuff('invalid parameter');
        }
        catch (e)
        {
            assert( e instanceof Error );
            return;
        }
        assert( false );
    });
    
    // Every test will stop and process will quit with an error code
    // If any assertion have failed.
});

// Will wait previous test to start ...
test("Another test", it =>
{
    // ...
})
```


### Commands from argv

```javascript
const { commands } = require('./cli');

// Use commands.add to register a command for CLI

// $ script dev -> { port: 4000, noCheck: false }
// $ script dev --port 2000 -> { port: 2000, noCheck: false }
// $ script dev --noCheck -> { port: 4000, noCheck: true }
commands.add('dev', { port: 4000, noCheck: false }, (options) =>
{
    // Do dev stuff ...
});

// $ script production
commands.add('production', () =>
{
    // Do production stuff ...
});

// $ script help
commands.add('help', () =>
{
    // Show help to user ...
});

// Will execute command with loose check
// Argument need to start like command to execute it
// $ script big
commands.add('bigCommandName', () => {});

// Start parsing and run matching command
commands.start( command =>
{
    // $ script
    // command === '' if no command is given
    
    // $ script badcommandname
    // command === 'badcommandname' if command has been given but not found
    
    // Show help to lost users
    commands.run('help');
});
```

### TODO : Doc for askMenu 
### TODO : Doc for askList 
### TODO : Doc for askInput
 
