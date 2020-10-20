const { askInput, execSync, askList, newLine, print} = require("../libraries/node-cli/cli");
const { autoTargetLibrary, getLibraryPackageJson } = require("./lib/libraries");
const path = require("path");

newLine();


autoTargetLibrary(true, async (libraryName) =>
{
	// Target library folder
	const libraryPath = path.join( 'libraries', libraryName );
	const libraryExecOptions = { cwd: libraryPath };
	const stdioLevel = 3;

	execSync(`npm run clean ${libraryName}`, 3);
	execSync(`npm run build ${libraryName}`, 3);

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

	// Increment with npm
	execSync(`npm version ${increment} -m"${libraryName} - %s - ${message}"`, stdioLevel, libraryExecOptions);

	// Update version from package json
	packageContent = getLibraryPackageJson(libraryName);

	// Add to git
	execSync(`git add .`, stdioLevel, libraryExecOptions);
	execSync(`git commit -m"${libraryName} - ${packageContent.version} : ${message}"`, stdioLevel, libraryExecOptions);
	execSync(`git push`, stdioLevel, libraryExecOptions);

	// Publish on npm
	execSync(`npm publish`, stdioLevel, libraryExecOptions);
});