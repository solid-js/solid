import {Stats} from "fs";
import * as rimraf from "rimraf/rimraf";


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
	exists ()
	{

	}

	isReal ()
	{
		// TODO : exists and not a symlink
	}

	isSymLink ()
	{

	}

	/**
	 * If this is a directory.
	 */
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

	async copy ( to:string )
	{

	}

	async move ( to:string )
	{

	}

	async link ( to:string )
	{

	}

	/**
	 * Delete this file or folder.
	 */
	async delete ()
	{
		return new Promise( resolve => rimraf( this._path, null, resolve ) );
	}

	/**
	 * Delete Alias
	 * @see delete()
	 */
	remove () { this.delete() }
}
