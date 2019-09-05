const { commands } = require('./cli');


commands.add('dev', { port: 4000, noCheck: false }, (options) =>
{
    console.log('DEV', options);
});

commands.add('production', () =>
{
    console.log('PRODUCTION');
});

commands.add('help', () =>
{
    console.log('HELP');
});

commands.start( command =>
{
    commands.run('help')
});