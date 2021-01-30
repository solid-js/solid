const { task, execSync } = require('@solid-js/cli');
const { autoTargetLibrary } = require("./lib/libraries");
const path = require('path');

autoTargetLibrary(false, async (libraryName) =>
{
	const libraryPath = path.join( 'libraries', libraryName );
	const nodeModulesPath = path.join(libraryPath, 'node_modules');

	const cleanTask = task(`Prune installing dependencies ${libraryName}`);
	execSync(`npm prune`, 0, { cwd: libraryPath });
	execSync(`npm i`, 0, { cwd: libraryPath });
	cleanTask.success();
});