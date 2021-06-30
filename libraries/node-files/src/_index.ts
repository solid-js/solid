

export * from './FileFinder';
export * from './File';
export * from './Directory';
export * from './FileParsers';
export * from './Struct';


/**
 * Resolve ~ (home) in file paths.
 * From : https://stackoverflow.com/questions/21077670/expanding-resolving-in-node-js
 */
const path = require('path');
export function resolveHome ( filePath ) {
	// Not from home directory
	if ( filePath[0] != '~' ) return filePath
	// replace ~ by home directory
	return path.join( process.env.HOME, filePath.slice(1) );
}