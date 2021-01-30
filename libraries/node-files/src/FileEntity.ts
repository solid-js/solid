const rimraf = require('rimraf');
const ncp = require('ncp');
import * as fs from "fs";
import * as nodePath from "path";

export class FileEntity
{
	// If this file entity exists
	// Got from stats
	protected _exists = false;

	/**
	 * File stats ( size, last modified date, stuff like that ).
	 * Call await File.updateStats() to update stats from disk.
	 */
	protected _stats			:fs.Stats;
	get stats ():fs.Stats { return this._stats; }

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
	 * All file extensions, lowercase and reversed.
	 * Directories can have extension too.
	 */
	get extensions () { return this._extensions }
	protected _extensions:string[];

	/**
	 * Last file extension, lowercase
	 */
	get extension () { return this._extensions[ this._extensions.length - 1 ] || null }

	// ------------------------------------------------------------------------- CONSTRUCT

	constructor ( path:string, stats?:fs.Stats )
	{
		this._path = path;
		this._stats = stats;

		// Get extensions, lower case and reverse them
		const dotIndex = path.indexOf('.');
		if ( dotIndex >= 0 )
			this._extensions = path.toLowerCase().substr( dotIndex + 1, path.length ).split('.').reverse();

		// Get base (parents directories from cwd)
		this._base = nodePath.dirname( path );

		// Get full name (name without base but with extensions)
		this._fullName = nodePath.basename( path );

		// Get name (full name without extensions)
		this._name = this._fullName.substr(0, this._fullName.lastIndexOf('.'));
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

	// ------------------------------------------------------------------------- STATS

	/**
	 * If this file or directory exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	async exists ()
	{
		await this.checkStats();
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

	// ------------------------------------------------------------------------- FS ACTIONS

	/**
	 * Will add file name to "to" if "to" is a directory.
	 * Will create parent directories if it does not exists.
	 *
	 * Ex : manipulate ".htaccess" to "dist".
	 * "to" will become dist/.htaccess if dist is a folder
	 * Ex : manipulate "template.htaccess" to "dist/.htaccess"
	 * "to" will still be "dist/.htaccess" because this is a folder
	 *
	 * @param to
	 */
	protected async safeTo ( to:string )
	{
		// Split slashes
		const toSlashSplit = to.split('/');

		// If last part of to path seems to be a file (contains a dot)
		const fileNameContainsADot = (
			toSlashSplit.length > 0 && toSlashSplit[ toSlashSplit.length -1 ]
			&&
			toSlashSplit[ toSlashSplit.length -1 ].indexOf('.') !== -1
		);

		// Then remove last part
		if ( fileNameContainsADot ) toSlashSplit.pop();

		// Create all parent folders if needed
		await new Promise( resolve => require('mkdirp')( toSlashSplit.join('/'), resolve));

		try
		{
			// Get end directory stats
			const toStats = await fs.promises.stat( to );
			if ( toStats.isDirectory() )
				to = nodePath.join(to, this._fullName);
		}
		catch ( e ) {}
		return to;
	}

	/**
	 * Copy this FileEntity recursively
	 * @param to Path of the clone
	 */
	async copy ( to:string )
	{
		return new Promise( async resolve => {
			to = await this.safeTo(to);
			ncp( this._path, to, resolve );
		});
	}

	/**
	 * Move this FileEntity recursively.
	 * @param to New path
	 */
	async move ( to:string )
	{
		return new Promise( async resolve => {
			to = await this.safeTo(to);
			fs.rename( this._path, to, resolve );
		});
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
		return new Promise( resolve => rimraf( this._path, resolve ) );
	}

	/**
	 * Delete Alias
	 * @see delete()
	 */
	async remove () { return await this.delete() }
}
