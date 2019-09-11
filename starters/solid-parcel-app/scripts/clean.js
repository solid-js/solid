require('./lib/installer');
const { print, commands,task } = require('@solid-js/cli');
const { M, D } = require('@solid-js/files');




commands.add('cache',
    () => task('Cleaning cache').run(
        () => D('.cache').remove()
    )
);
commands.add('dist',
    () => task('Cleaning dist').run(
        () => D('dist').clean()
    )
);



commands.add('all', async () =>
{
    await commands.run('cache');
    await commands.run('dist');
});
commands.start( () => commands.run('all') );