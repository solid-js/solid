const { task, execSync } = require('@solid-js/cli');
const { autoTargetLibrary } = require("./lib/libraries");
const path = require('path');
const rimraf = require('rimraf');

const rootTask = task(`Reinstalling node_modules on root folder`);
rimraf.sync('node_modules');
execSync(`npm i`);
rootTask.success();

autoTargetLibrary(false, async (libraryName) =>
{
	const libraryPath = path.join( 'libraries', libraryName );
	const nodeModulesPath = path.join(libraryPath, 'node_modules');

	const cleanTask = task(`Re-installing dependencies ${libraryName}`);
	rimraf.sync( nodeModulesPath );
	execSync(`npm i`, 0, { cwd: libraryPath });
	cleanTask.success();
});