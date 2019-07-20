const { log, error, exec } = require('./cli');


const GlobSync = require('glob').sync;


GlobSync('./libraries/**/*.js');