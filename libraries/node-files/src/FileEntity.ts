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
	 * Main extension, lowercase.
	 */
	get extension () { return this._extensions[ 0 ] || null }

	// ------------------------------------------------------------------------- CONSTRUCT

	constructor ( path:string, stats?:fs.Stats )
	{
		if ( !path )
			throw new Error(`FileEntity.constructor // FileEntity needs a path to be initialized.`);

		this._path = path;
		this._stats = stats;

		this.updateFileProperties();
	}

	// ------------------------------------------------------------------------- UPDATE FILE PROPERTIES

	protected updateFileProperties ()
	{
		// Get extensions, lower case and reverse them
		const dotIndex = this._path.indexOf('.');
		if ( dotIndex >= 0 )
			this._extensions = this._path.toLowerCase().substr( dotIndex + 1, this._path.length ).split('.').reverse();

		// Get base (parents directories from cwd)
		this._base = nodePath.dirname( this._path );

		// Get full name (name without base but with extensions)
		this._fullName = nodePath.basename( this._path );

		// Get name (full name without extensions)
		this._name = this._fullName.substr(0, this._fullName.lastIndexOf('.'));
	}

	// ------------------------------------------------------------------------- STATS

	/**
	 * Update file stats from disk synchronously ( size, last modified date, stuff like that ).
	 */
	update ()
	{
		// Get stats and try to detect if file really exists
		try {
			this._stats = fs.statSync( this.path );
			this._exists = true;
		}
			// Fail silently here
		catch (e) {
			// File does not exists
			if ( e.code === 'ENOENT')
			{
				this._stats = null;
				this._exists = false;
			}
		}
		return this;
	}

	/**
	 * Update file stats from disk asynchronously ( size, last modified date, stuff like that ).
	 */
	async updateAsync ()
	{
		// Get stats and try to detect if file really exists
		try {
			this._stats = await fs.promises.stat( this.path );
			this._exists = true;
		}
		// Fail silently here
		catch (e) {
			// File does not exists
			if ( e.code === 'ENOENT')
			{
				this._stats = null;
				this._exists = false;
			}
		}
	}

	// ------------------------------------------------------------------------- STATS - EXISTS

	/**
	 * If this file or directory exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	exists () {
		if ( !this._stats ) this.update();
		return this._exists;
	}

	/**
	 * If this file or directory exists in the file system.
	 * Can be false when creating a new file for example.
	 */
	async existsAsync () {
		if ( !this._stats ) await this.updateAsync();
		return this._exists;
	}

	// ------------------------------------------------------------------------- STATS - IS REAL

	/**
	 * File exists and is not a symbolic link
	 */
	isReal () {
		if ( !this._stats ) this.update();
		return this._exists && !this._stats.isSymbolicLink()
	}

	/**
	 * File exists and is not a symbolic link
	 */
	async isRealAsync () {
		if ( !this._stats ) await this.updateAsync();
		return this._exists && !this._stats.isSymbolicLink()
	}

	/**
	 * File exists and is a symbolic link
	 */
	isSymbolicLink () { return !this.isReal() }

	/**
	 * File exists and is a symbolic link
	 */
	async isSymbolicLinkAsync () { return !(await this.isRealAsync()) }

	// ------------------------------------------------------------------------- STATS - LAST MODIFIED

	/**
	 * Get last modified timestamp ( as ms )
	 */
	lastModified ():number|false {
		this.update();
		return this._exists && this._stats.mtimeMs;
	}

	/**
	 * Get last modified timestamp ( as ms )
	 */
	async lastModifiedAsync ():Promise<number|false> {
		await this.updateAsync();
		return this._exists && this._stats.mtimeMs;
	}

	// ------------------------------------------------------------------------- STATS - IS REAL

	/**
	 * If file exists and is a directory, not a file.
	 */
	isDirectory () {
		if ( !this._stats ) this.update();
		return this._exists && this._stats.isDirectory()
	}

	/**
	 * If file exists and is a directory, not a file.
	 */
	async isDirectoryAsync () {
		if ( !this._stats ) await this.updateAsync();
		return this._exists && this._stats.isDirectory()
	}

	/**
	 * If file exists and is a file, not a directory.
	 */
	isFile () {
		if ( !this._stats ) this.update();
		return this._exists && this._stats.isFile()
	}
	async isFileAsync () {
		if ( !this._stats ) await this.updateAsync();
		return this._exists && this._stats.isFile()
	}

	// ------------------------------------------------------------------------- ENSURE

	/**
	 * Create all needed parent directory to this file / directory.
	 */
	ensureParents () {
		// @ts-ignore
		require('mkdirp').sync( this._base );
	}

	/**
	 * Create all needed parent directory to this file / directory.
	 */
	async ensureParentsAsync () {
		return new Promise( resolve => require('mkdirp')( this._base, resolve ) );
	}

	// ------------------------------------------------------------------------- SAFE-TO ARGUMENT

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

	// ------------------------------------------------------------------------- COPY TO / MOVE TO

	/**
	 * Copy this FileEntity recursively.
	 * Asynchronous call only.
	 * @param to path of the clone
	 */
	async copyToAsync ( to:string )
	{
		return new Promise( async resolve => {
			to = await this.safeTo(to);
			ncp( this._path, to, resolve );
		});
	}

	/**
	 * Move this FileEntity recursively.
	 * Asynchronous call only.
	 * @param to new path
	 */
	async moveToAsync ( to:string )
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
	async renameAsync ( to:string ) { return this.moveToAsync( to ) }

	// ------------------------------------------------------------------------- SYMBOLIC LINKS

	/**
	 * Create a symbolic link to this FileEntity.
	 * @param to Path of created symbolic link.
	 */
	linkTo ( to:string ) {
		fs.symlinkSync( this._path, to );
	}

	/**
	 * Create a symbolic link to this FileEntity.
	 * @param to Path of created symbolic link.
	 */
	async linkToAsync ( to:string ) {
		await fs.promises.symlink( this._path, to );
	}

	// ------------------------------------------------------------------------- DELETE

	/**
	 * Delete this file or folder.
	 * TODO : Force needs to be true to remove files parent to process.cwd
	 */
	async delete ( force = false ) {
		return new Promise( resolve => rimraf( this._path, resolve ) );
	}

	/**
	 * Delete Alias
	 * @see delete()
	 */
	async remove ( force = false ) { return await this.delete( force ) }
}
