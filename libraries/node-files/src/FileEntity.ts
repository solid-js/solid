import * as rimraf from "rimraf";
import * as ncp from "ncp";
import * as fs from "fs";
import * as nodePath from "path";

export class FileEntity
{
	// Stats of current file entity
	protected _stats:fs.Stats;

	// If this file entity exists
	// Got from stats
	protected _exists = false;

	/**
	 * Path pointing to the file or directory
	 */
	get path ():string { return this._path; }
	protected _path:string;

	/**
	 * Concrete type of File Entity
	 * @returns null, "file" or "directory"
	 */
	get type () { return this._type }
	protected _type:string;

	/**
	 * Get base (parent directories from cwd)
	 */
	get base () { return this._base }
	protected _base:string;

	/**
	 * File name, without base and without extensions
	 */
	get name () { return this._name }
	protected _name:string;

	/**
	 * File name, without base, with extensions
	 */
	get fullName () { return this._fullName }
	protected _fullName:string;

	/**
	 * File extensions, reversed.
	 * Directories can have extension too !
	 */
	get extensions () { return this._extensions }
	protected _extensions:string[];

	// ------------------------------------------------------------------------- CONSTRUCT

	/**
	 *
	 * @param path
	 * @param stats
	 */
	constructor ( path:string, stats?:fs.Stats )
	{
		this._path = path;
		this._stats = stats;

		// Get extensions, lower case and reverse them
		const dotExt = nodePath.extname( path ).toLowerCase();
		this._extensions = dotExt.substr(1, dotExt.length).split('.').reverse();

		// Get base (parents directories from cwd)
		this._base = nodePath.dirname( path );

		// Get full name (name without base but with extensions)
		this._fullName = nodePath.basename( path );

		// Get name (full name without extension)
		this._name = this._fullName.substr(this._fullName.indexOf('.'), this._fullName.length);
	}

	// ------------------------------------------------------------------------- STATS

	/**
	 * Update file stats ( size, last modified date, stuff like that ).
	 * Stats will be available in File.stats or through specific methods ( like lastModified() )
	 */
	async updateStats ():Promise<fs.Stats>
	{
		// Get stats and try to detect if file really exists
		let exists = true;
		try
		{
			this._stats = await fs.promises.stat( this.path );
		}
		// Fail silently here
		catch (e)
		{
			// File does not exists
			if ( e.code === 'ENOENT') exists = false;
		}

		// Save exists and return stats
		this._exists = exists;
		return this._stats;
	}

	/**
	 * Check stats availability and request file stats from disk if needed.
	 */
	protected async checkStats ()
	{
		if (!this._stats) await this.updateStats();
	}

	// ------------------------------------------------------------------------- FILE SYSTEM STATES

	/**
	 * If this file or directory exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	async exists ()
	{
		this.checkStats();
		return this._exists;
	}

	/**
	 * File exists and is not a symbolic link
	 */
	async isReal ()
	{
		await this.checkStats();
		return this._exists && !this._stats.isSymbolicLink()
	}

	/**
	 * File exists and is a symbolic link
	 */
	async isSymLink ()
	{
		await this.checkStats();
		return this._exists && !this._stats.isSymbolicLink()
	}

	/**
	 * If this is a directory.
	 */
	async isDirectory ()
	{
		await this.checkStats();
		return this._stats.isDirectory()
	}

	/**
	 * If this is a file.
	 */
	async isFile ()
	{
		await this.checkStats();
		return this._stats.isFile()
	}

	// ------------------------------------------------------------------------- FILE SYSTEM ACTIONS

	/**
	 * Copy this FileEntity recursively
	 * @param to Path of the clone
	 */
	async copy ( to:string )
	{
		return new Promise( resolve => ncp( this._path, to, resolve ) );
	}

	/**
	 * Move this FileEntity recursively.
	 * @param to New path
	 */
	async move ( to:string )
	{
		return new Promise( resolve => fs.rename( this._path, to, resolve ) );
	}

	/**
	 * Rename is an alias to move.
	 * @see move()
	 * @param to New path
	 */
	async rename ( to:string ) { return this.move( to ) }

	/**
	 * Create a symbolic link to this FileEntity.
	 * @param to Path of created symbolic link.
	 */
	async link ( to:string )
	{
		await fs.promises.symlink( this._path, to );
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
	async remove () { await this.delete() }
}
