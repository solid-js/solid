const { task } = require('../libraries/node-cli/cli');
const rimraf = require('rimraf');

const GlobSync = require('glob').sync;
const path = require('path');

const librariesTask = task('Clean libraries');

// Browse all dist folder from libraries
GlobSync( path.join('libraries', '*', 'dist') ).map(
    distPath => rimraf.sync(distPath)
);

librariesTask.success();