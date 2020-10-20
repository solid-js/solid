
const { askInput, execSync, halt, table, task, askList, newLine, offset, print} = require("../libraries/node-cli/cli");
const { testLibrary, autoTargetLibrary, buildLibrary, getLibraryPackageJson } = require("./lib/libraries");
const filesize = require("filesize");
const chalk = require("chalk");
const path = require("path");

newLine();

autoTargetLibrary(true, async (libraryName) =>
{
	// Target library folder
	const libraryPath = path.join( 'libraries', libraryName );

	// Get package json and show current version
	let packageContent = getLibraryPackageJson( libraryName );
	print(`Current version of ${libraryName} is ${packageContent.version}`)
	newLine();

	// Ask how to increment version
	const increment = await askList(`How to increment ?`, [
		'patch', 'minor', 'major', 'exit'
	]);
	if ( increment === 'exit' ) process.exit();

	// Get commit message
	let message = await askInput(`Commit message ?`);
	message = message.replace(/["']/g, "'");

	const execOptions = { cwd: libraryPath };
	const stdioLevel = 3;

	// Increment with npm
	execSync(`npm version ${increment} -m"${libraryName} - %s - ${message}"`, stdioLevel, execOptions);

	// Update version from package json
	packageContent = getLibraryPackageJson(libraryName);

	// Add to git
	execSync(`git add .`, stdioLevel, execOptions);
	execSync(`git commit -m"${libraryName} - ${packageContent.version} : ${message}"`, stdioLevel, execOptions);
	execSync(`git push`, stdioLevel, execOptions);

	// Publish on npm
	execSync(`npm publish`, stdioLevel, execOptions);
});