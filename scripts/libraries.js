/**
 * Release mode (wip / patch / minor / major) :
 * NPM Script to release current version to Git and NPM.
 * First argument is increment of package.json (patch / minor / major)
 * or "wip" for work in progress.
 * Second argument is commit message
 */
const { log, error, exec } = require('./cli');

const action = process.argv[2];
if (!(2 in process.argv)) error('Missing action parameter');


log('action', action);


//tsc -p tsconfig.libraries.json