const path = require('path');

exports.config = {
    entries: [
        path.join(__dirname, 'src/index.html')
    ],

    outDir : './dist',
    outFile : 'index.html',
    publicUrl : './', // = base
    logLevel : 3
};