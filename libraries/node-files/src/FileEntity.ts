import {Stats} from "fs";



export class FileEntity
{
	// Path pointing to the file or directory
	protected _path:string;
	get path ():string { return this._path; }

	protected _stats:Stats;

	constructor ( filePath:string, stats?:Stats )
	{
		this._path = filePath;
		this._stats = stats;
	}

	// ------------------------------------------------------------------------- FILE SYSTEM STATES

	/**
	 * If this file or directory exists in the file system.
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
	 * If this is a directory.
	 */
	isDir () { return this.isDirectory() }
	isFolder () { return this.isDirectory() }
	isDirectory ()
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
