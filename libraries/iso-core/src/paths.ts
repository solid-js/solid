
/**
 * Get file name from any path.
 * Will return full string if no slash found.
 * ex : 'usr/bin/TestFile' will return 'TestFile'
 */
export function getFileFromPath (path:string):string
{
	let lastIndex = path.lastIndexOf('/');
	if ( lastIndex == -1 ) lastIndex = 0;
	return path.substring( lastIndex + 1, path.length );
}

/**
 * Get the base folder from any path.
 * Will include trailing slash.
 * Will return full string if no slash found.
 * ex: 'usr/bin/TestFile' will return 'usr/bin/'
 */
export function getBaseFromPath (path:string):string
{
	let lastIndex = path.lastIndexOf('/');
	if ( lastIndex == -1 ) lastIndex = path.length;
	return path.substring(0, lastIndex);
}

/**
 * Get the local path from a full path and a base.
 * For ex : will extract /dir/file.html from /my/base/dir/file.html with base /my/base
 * To work, base have to be the exact beginning of path. This is to avoid issues with bases like '/'
 * If base is invalid, path will be returned.
 * No error thrown.
 * If you want starting slash or not, please use StringUtils.trailingSlash method on path and / or pBase
 */
export function extractPathFromBase (path:string, base:string):string
{
	// Get the index of base within the path
	let baseStartIndex = path.indexOf( base );

	return (
		// Base is starting path so its ok
		baseStartIndex == 0
		? path.substr( base.length, path.length )
		// Invalid base for this path, do nothing
		: path
	);
}

/**
 * Remove extensions.
 * You can set how many level of extensions to remove.
 * Ex : file.config.js
 * level 1 -> file.config
 * level 2 -> file
 */
export function removeExtensions (path:string, extensionLevelToRemove = 1) {
	return path.split('.').slice(0, - extensionLevelToRemove ).join('.')
}

/**
 * Get extensions from a filename.
 * Will return list of extensions, inverted
 * Ex : 'file.module.less' -> ['less', 'module']
 * Ex : 'a-folder/' -> []
 * @param fileName File name only, not full path.
 */
export function extractExtensions (fileName:string):string[]
{
	let parts = fileName.split('.')
	parts.shift()
	return parts.reverse()
}
