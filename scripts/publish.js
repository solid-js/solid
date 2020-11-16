const { askInput, execSync, askList, newLine, print, halt } = require("@solid-js/cli");
const { autoTargetLibrary, getLibraryPackageJson } = require("./lib/libraries");
const path = require("path");

newLine();
autoTargetLibrary(true, async (libraryName) =>
{
	// Check if user logued to npm
	newLine();
	try {
		const connectedUser = execSync(`npm whoami`).toString();
		print(`> Connected user : ${connectedUser}`);
	}
	catch (e) {
		halt(`> Please connect to npm with ${'npm login'.bold()}`, 1, false);
	}

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
	const version = execSync(`npm version ${increment} -m"${libraryName} - %s - ${message}"`, undefined, libraryExecOptions).toString();

	// Update version from package json
	packageContent = getLibraryPackageJson(libraryName);

	// Add to git
	execSync(`git add .`, stdioLevel, libraryExecOptions);
	execSync(`git commit -m"${libraryName} - ${packageContent.version} : ${message}"`, stdioLevel, libraryExecOptions);
	execSync(`git push`, stdioLevel, libraryExecOptions);

	// Publish on npm
	execSync(`npm publish`, stdioLevel, libraryExecOptions);

	print(`Published, new version is ${version}`)
});