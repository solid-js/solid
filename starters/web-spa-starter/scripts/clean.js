require('./lib/installer');
const { print, commands,task } = require('@solid-js/cli');
const { M, D } = require('@solid-js/files');




commands.add('cache', async () =>
{
    const cleanTask = task('Cleaning cache');
    await D('.cache').remove();
    cleanTask.success();
});
commands.add('dist', async () =>
{
    const cleanTask = task('Cleaning dist');
    await D('dist').remove();
    cleanTask.success();
});



commands.add('all', async () =>
{
    await commands.run('cache');
    await commands.run('dist');
});
commands.start( () => commands.run('all') );