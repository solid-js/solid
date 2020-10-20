const { task, newLine } = require('@solid-js/cli');
const { autoTargetLibrary } = require("./lib/libraries");
const path = require('path');
const rimraf = require('rimraf');

newLine();
autoTargetLibrary(false, async (libraryName) =>
{
	const libraryPath = path.join( 'libraries', libraryName );
	const distPath = path.join(libraryPath, 'dist');

	const cleanTask = task(`Cleaning ${libraryName}`);
	rimraf.sync( distPath );
	cleanTask.success();
});