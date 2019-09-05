// Install node modules
require('./lib/installer');
const builder = require("./lib/builder");

const { print, task, commands } = require('@solid-js/cli');
//const { M, F, D } = require('@solid-js/files');


function build ( production, noCheck )
{



}

commands.add('dev', { noCheck:false }, async options =>
{
    print(' 🤖  Development mode');
    await builder.run( false, options.noCheck );
});


commands.add('production', { noCheck:false }, async options =>
{
    print(' 🚀  Building for production');
    await builder.run( true, options.noCheck );
});


commands.start();