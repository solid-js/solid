require('./lib/installer');
const { print, commands } = require('@solid-js/cli');
const { M, D } = require('@solid-js/files');


commands.add('all', async () =>
{
    await commands.run('cache');
    await commands.run('dist');
});


commands.add('cache', async () => await D('.cache').remove() );
commands.add('dist', async () => await D('dist').remove() );


commands.start( () => commands.run('all') );