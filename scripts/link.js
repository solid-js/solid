const path = require( "path" );
const { task, execSync } = require( "@solid-js/cli" );
const { listLibraries } = require( "./lib/libraries" );
const { newLine, halt, print, hookStandards } = require("@solid-js/cli");
const { autoTargetLibrary } = require("./lib/libraries");

// No arguments, link all libraries
if ( process.argv.length === 2 ) {
    const allLibraries = listLibraries();
    const linkTask = task(`Linking all libraries`);

    allLibraries.map( (libraryName, i) => {
        linkTask.progress(i, allLibraries.length, 30, '@solid-js/'+libraryName);
        const linkedLibraryPath = path.join( 'libraries', libraryName );
        execSync(`npm link`, {cwd: linkedLibraryPath});
    })

    linkTask.success();
    return;
}

// Linking 2 specific libs, we need libraryName and libraryToLink argument
if ( process.argv.length < 3 ) {
    newLine();
    hookStandards(process.stdout, process.stderr, () => {});
    halt('  Missing library to link', 0, true);
    print('     Usage : npm link $libraryName $libraryToLink', true);
    print('     Ex : npm link node-files iso-core', true);
    newLine();
    process.exit(1);
}

// Get library to link
let libraryToLink = process.argv[3];

// Check if this library exists and has a package.json
const allLibraries = listLibraries().filter( lib => lib === libraryToLink );
if ( allLibraries.length === 0 ) {
    newLine();
    halt(`  Library to link ${libraryToLink} not found.`);
}

// Get destination library
newLine();
autoTargetLibrary( true, ( libraryName ) =>
{
    // Target origin linked library path
    const linkedLibraryPath = path.join( 'libraries', libraryToLink );

    // Convert "iso-core" to "@solid-js/core"
    libraryToLink = '@solid-js/'+libraryToLink.split('-')[1];

    // Linking linked library
    const linkingTask = task(`Linking ${libraryName} to ${libraryToLink}`);
    linkingTask.progress(1, 3);
    try {
        execSync(`npm link`, { cwd: linkedLibraryPath });
    }
    catch (e) {
        linkingTask.error(e, 1);
    }
    linkingTask.progress(2, 3);

    // Linking host library to origin
    const libraryPath = path.join( 'libraries', libraryName );
    try {
        execSync(`npm link ${libraryToLink}`, { cwd: libraryPath });
    }
    catch (e) {
        linkingTask.error(e, 1);
    }
    linkingTask.progress(3, 3);
    linkingTask.success();
    newLine();
});
