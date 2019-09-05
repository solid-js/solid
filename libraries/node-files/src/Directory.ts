import { FileEntity } from './FileEntity'
import * as path from "path";


/**
 * TODO DOC
 * @param directoryPath
 * @param cwd
 * @constructor
 */
export function D ( directoryPath:string, cwd?:string ):Directory
{
	cwd = cwd || process.cwd();
	const fullPath = path.join( cwd, directoryPath );
	return new Directory( fullPath );
}



export class Directory extends FileEntity
{
	create ()
	{
		
	}

	// V1 : last modified of any folder (FileEntity ?)

	// V2 : Size of a whole folder
	// V2 : Zip/tar.gz a folder with native linux zip
}