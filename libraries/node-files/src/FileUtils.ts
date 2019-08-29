import * as fs from 'fs';

export function exists (path:string)
{
	return fs.existsSync( path );
}

export function isFile (path:string)
{
	return fs.statSync( path ).isFile();
}

export function isFolder (path:string)
{
	return fs.statSync( path ).isDirectory();
}
