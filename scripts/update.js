const { task, execSync } = require('@solid-js/cli');
const { autoTargetLibrary } = require("./lib/libraries");
const path = require('path');

const rootTask = task(`Updating root dependencies`);
execSync(`npm up`);
rootTask.success();

autoTargetLibrary(false, async (libraryName) =>
{
	const libraryPath = path.join( 'libraries', libraryName );
	const cleanTask = task(`Updating dependencies ${libraryName}`);
	execSync(`npm up`, 0, { cwd: libraryPath });
	cleanTask.success();
});