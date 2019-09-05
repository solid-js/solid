require('./lib/installer');
const builder = require("./lib/builder");
const { print, commands } = require('@solid-js/cli');


commands.add('dev', { noCheck:false }, async options =>
{
    print('🤖  Development mode');
    await builder.run( false, options.noCheck );
});


commands.add('production', { noCheck:false }, async options =>
{
    print('🚀  Building for production');
    await builder.run( true, options.noCheck );
});


commands.start();