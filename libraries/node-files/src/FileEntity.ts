import * as FileUtils from './FileUtils'
import {Stats} from "fs";



export class FileEntity
{
	// Path pointing to the file or folder
	readonly path:string;

	protected _stats:Stats;

	constructor ( filePath:string, stats?:Stats )
	{
		this.path = filePath;
		this._stats = stats;
	}

	// ------------------------------------------------------------------------- FILE SYSTEM STATES

	/**
	 * If this file or folder exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	isReal () { return this.exists() }
	exists ()
	{

	}

	isSymLink ()
	{

	}

	/**
	 * If this is a folder.
	 */
	isDir () { return this.isFolder() }
	isDirectory () { return this.isFolder() }
	isFolder ()
	{

	}

	/**
	 * If this is a file.
	 */
	isFile ()
	{

	}


	// ------------------------------------------------------------------------- FILE SYSTEM ACTIONS

	copy ()
	{

	}

	move ()
	{

	}

	remove () { this.delete() }
	delete ()
	{

	}
}
