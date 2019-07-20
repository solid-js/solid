const path = require('path');
const fs = require('fs');

module.exports = {

    /**
     * Utility to recursively change files extensions into a folder
     */
    recursiveChangeExtension : ( dir, from, to ) =>
    {
        // Browse this folder
        fs.readdirSync( dir ).forEach( f =>
        {
            // Get file info
            const filePath = path.join( dir, f );
            const stats = fs.lstatSync( filePath );

            // Recursive browse and rename if this is a directory
            if ( stats.isDirectory() )
            {
                module.exports.recursiveChangeExtension( filePath, from, to );
            }

            // Rename if this is searched type of file
            else if ( path.extname( f ) === from )
            {
                fs.renameSync( filePath, filePath.replace(from, to) );
            }
        });
    }
};