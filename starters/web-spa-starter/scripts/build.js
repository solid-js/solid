require('./lib/installer');
const builder = require("./lib/builder");
const { print, commands } = require('@solid-js/cli');


commands.add('dev', { noCheck:false }, async options =>
{
    print('🤖 Development mode');
    process.env.NODE_ENV = 'development';
    await builder.run( options.noCheck );
});


commands.add('production', { noCheck:false }, async options =>
{
    print('🚀 Building for production');
    process.env.NODE_ENV = 'production';
    await builder.run( options.noCheck );
});


commands.start();