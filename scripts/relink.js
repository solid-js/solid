const path = require( "path" );
const glob = require( "glob" );
const { task, execSync } = require( "@solid-js/cli" );
const { listLibraries } = require( "./lib/libraries" );
const { newLine, halt, print, hookStandards } = require("@solid-js/cli");
const { autoTargetLibrary } = require("./lib/libraries");

function linkLibrary ( libraryName, log = true )
{
    // Target origin linked library path
    const linkedLibraryPath = path.join( 'libraries', libraryName );
    const packageData = require('../'+path.join(linkedLibraryPath, 'package.json'));

    const linkingTask = log ? task(`Linking ${libraryName}`) : null;

    const dependenciesToLink = Object.keys( packageData.dependencies || {} ).map( key => {
        return key.indexOf('@solid-js/') === 0 ? key.split('/')[1] : false
    }).filter( v => v );

    dependenciesToLink.map( (libraryToLink, i) => {
        log && linkingTask.progress(i, dependenciesToLink.length);
        // const fullName = glob.sync(`*-${libraryToLink}`, { cwd: 'libraries'} )[0] ?? 'null';
        try {
            //execSync(`npm run link ${libraryName} ${fullName}`);
            execSync(`npm link @solid-js/${libraryToLink}`, 0, {
                cwd: linkedLibraryPath
            });
        }
        catch (e) {
            linkingTask.error(e, 1);
        }
    })

    log && linkingTask.success();
}

// No arguments, link all libraries
if ( process.argv.length === 2 ) {
    const allLibraries = listLibraries();
    const linkTask = task(`Linking all libraries`);

    allLibraries.map( (libraryName, i) => {
        linkTask.progress(i, allLibraries.length, 30, '@solid-js/'+libraryName);
        linkLibrary( libraryName, false );
    })

    linkTask.success();
    return;
}

// Get destination library
newLine();
autoTargetLibrary( true, ( libraryName ) => {
    linkLibrary( libraryName )
});
