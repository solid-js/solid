const { askList } = require("@solid-js/cli");
const { M } = require("@solid-js/files");
const { halt } = require("@solid-js/cli");


exports.askComponentType = async function ( type = "component" )
{
    return await askList(
        `Which ${type} type ?`,
        ['Functional', 'Class', 'Yadl'],
        ['type', 't']
    );
};

exports.askComponentFolder = async function  ()
{
    return await askList(
        'Which component folder ?',
        ['components', 'molecules'],
        ['folder', 'f']
    );
};

exports.askComponentFolder = async function  ()
{
    return await askList(
        'Which page folder ?',
        ['pages', 'overlays'],
        ['folder', 'f']
    );
};

exports.askBundle = async function ()
{
    const directories = await M('src/*').directories();

    if ( directories.length === 0 )
        halt('Unable to find any bundle in your app. Try to scaffold a new App Bundle before.', 1, true);
    else if ( directories.length === 1)
        return directories[0].path;
    else
        return await askList('Which bundle ?', directories, ['--bundle', '-b']);
};
