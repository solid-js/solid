/**
 * Work in progress dev file.
 * This file is meant to be used when working on your lib.
 * Useful when trying to get something working before it's testable.
 */

const { M, F, D } = require('./dist/index');


const cwd = 'warzone';


const tests = {

    async matchCWD1 ()
    {
        M('warzone/1.txt').paths(
            path => console.log(path)
        );
    },

    async matchCWD2 ()
    {
        M('1.txt', cwd).paths(
            path => console.log(path)
        );
    },

    async matchMulti1 ()
    {
        M('**/*.txt', cwd).paths(
            path => console.log(path)
        );
    },

    async matchMulti2 ()
    {
        M('*.txt', cwd).paths(
            path => console.log(path)
        );
    },

    async file ()
    {
        const newContent = await F('1.txt', cwd).read( async file =>
        {
            await file.read();
            console.log(file.content());
            /*
            file.line(2, 'new line 2')
                .template({
                    super: 'New super',
                    cool: Date.now()
                });
            console.log('->', file.data);
             */
        });

        //console.log( newContent );
    }

};

(async () =>
{
    // await tests.matchCWD1();
    // await tests.matchCWD2();
    // await tests.matchMulti1();
    // await tests.matchMulti2();

    await tests.file();
})();
