require('./lib/installer');
const { M } = require("@solid-js/files");
const { halt, askMenu, askList, askInput } = require("@solid-js/cli");
const { askBundle, askComponentFolder, askComponentType, askPageFolder } = require('./lib/scaffolder');



// ----------------------------------------------------------------------------- MAIN MENU

askMenu('Which entity to create :', [
	{
		title: 'Component',
		shortcuts: ['component', 'c'],
		action: createComponent
	},
	{
		title: 'Page',
		shortcuts: ['page', 'p'],
		action: createPage
	},
	"---",
	{
		title: 'Web font',
		shortcuts: ['font', 'f'],
		action: createFont
	},
	{
		title: 'Sprite',
		shortcuts: ['sprite', 's'],
		action: createSprite
	},
	"---",
	{
		title: 'App Bundle',
		shortcuts: ['app', 'bundle', 'a', 'b'],
		action: createBundle
	}
]);

// ----------------------------------------------------------------------------- ACTIONS

async function createComponent ()
{
	const bundle = await askBundle();
	const componentType = await askComponentType();
	const componentFolder = await askComponentFolder();
	const componentName = await askInput('Component name ?', ['name', 'n']);

	// TODO
	console.log({bundle, componentType, componentFolder, componentName});
}

async function createPage ()
{
	const bundle = await askBundle();
	const pageType = await askComponentType("page");
	const pageFolder = await askPageFolder();

	// TODO
	console.log({bundle, pageType, pageFolder});
}

async function createFont ()
{
	// TODO
}

async function createSprite ()
{
	// TODO
}

async function createBundle ()
{
	// TODO
}