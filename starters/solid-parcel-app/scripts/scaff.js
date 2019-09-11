require('./lib/installer');
const { M } = require("@solid-js/files");
const { halt } = require("@solid-js/cli");

function ask ()
{

}

async function askComponentType ()
{
    await ask('Which component type ?', ['Functional', 'Class', 'Yadl']);
}

async function askComponentFolder ()
{
    // TODO
    //await ask('Which component folder ?', ['Functional', 'Class', 'Yadl']);
}

async function askBundle ()
{
    const directories = await M('src/*').directories();

    if ( directories.length === 0 )
        halt('Unable to find any bundle. Try to scaffold a new App Bundle before.');
    else if ( directories.length === 1)
        return directories[0];
    else
        await ask('Which bundle ?', directories);
}

async function askName ( title )
{
    // ...
}


exports.default = {

    menu: {
        "Component"     : this.createComponent,
        "Page"          : this.createPage,
        "Web Font"      : this.createFont,
        "Sprite"        : this.createSprite,
        "App Bundle"    : this.createBundle
    },

    async createComponent ()
    {
        const componentType = await askComponentType();
        const bundle = await askBundle();
        const componentFolder = await askComponentFolder();
        const componentName = await askName("Component name ?");
    },

    createPage ()
    {

    },

    createFont ()
    {

    },

    createSprite ()
    {

    },

    createBundle ()
    {

    }
};