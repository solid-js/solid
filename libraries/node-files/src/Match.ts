import * as fs from "fs";
import * as path from 'path'
import { FileEntity } from './FileEntity'
import { File } from './File'
import { Folder } from './Folder'
import glob from "glob";

// ----------------------------------------------------------------------------- STRUCTURE

// Defining what is a basic file filter

interface IFilter
{
	(filePath:string) : boolean
}

// Handlers types
type PathHandler 	= (path:string)		 	=> any
type EntityHandler 	= (entity:FileEntity) 	=> any
type FileHandler 	= (entity:File) 		=> any
type FolderHandler 	= (entity:Folder) 		=> any

// ----------------------------------------------------------------------------- GLOBAL HELPERS / MAIN CLASS

/**
 * Target files and folders from a glob.
 * @param pattern Glob pattern @see https://www.npmjs.com/package/glob
 * @param cwd Root directory to search from. Default is process.cwd()
 * @param filter Filter function to filter some files at each updates. Useful to simplify glob pattern.
 */
export function F$ ( pattern:string, cwd?:string, filter?:IFilter ):Match
{
	return new Match( pattern, cwd, filter );
}

/**
 * Target files and folders from a glob synchronously.
 * In sync mode, glob updates are synchronous. It can hurt main thread, like running servers
 * but is preferable for static node routines and can avoid top level awaits.
 * @param pattern Glob pattern @see https://www.npmjs.com/package/glob
 * @param cwd Root directory to search from. Default is process.cwd()
 * @param filter Filter function to filter some files at each updates. Useful to simplify glob pattern.
 */
/*
export function F$ync ( pattern:string, cwd?:string, filter?:IFilter )
{
	return new Match( pattern, cwd, filter, true )
}
*/



export class Match
{
	// ------------------------------------------------------------------------- LOCALS

	// Glob pattern @see https://www.npmjs.com/package/glob
	readonly pattern		:string;

	// Root directory to search from.
	readonly cwd			:string;

	// Filter function to filter some files at each updates. Useful to simplify glob pattern.
	readonly filter			:IFilter;

	// List of all file and folders paths found after update() from glob and filter.
	protected _paths		:string[];

	protected _fileEntities :FileEntity[];

	// If an update is running asynchronously
	protected _isUpdating		:boolean = false;
	get isUpdating () { return this._isUpdating }


	// ------------------------------------------------------------------------- INIT & UPDATE

	/**
	 * Target files and folders from a glob.
	 * @param pattern Glob pattern @see https://www.npmjs.com/package/glob
	 * @param cwd Root directory to search from. Default is process.cwd()
	 * @param filter Filter function to filter some files at each updates. Useful to simplify glob pattern.
	 */
	constructor ( pattern:string, cwd?:string, filter?:IFilter )
	{
		// Save match parameters and search for the first time
		this.pattern 	= pattern;
		this.cwd 		= cwd || process.cwd();
		this.filter 	= filter;
	}

	/**
	 * Update files list from current glob.
	 * Match.glob is a public property and can be updated.
	 * a new Match.paths property is written after this call.
	 * Match.filter is used to filter files paths.
	 */
	update ():Promise<string[]>
	{
		return new Promise( (resolve, reject) =>
		{
			// Reject if any update is already running on this match
			if ( this._isUpdating )
			{
				reject( new Error( 'Match already updating.' ) );
				return
			}

			delete this._fileEntities;
			delete this._paths;

			this._isUpdating = true;


			// Get all file paths from glob
			glob( this.pattern, { cwd: this.cwd }, async ( error, paths ) =>
			{
				this._isUpdating = false;

				// Reject if any error occurred
				if ( error )
				{
					reject( error );
					return
				}

				// Filter paths with constructor filter
				// Filter them only if we have a filter function
				this._paths = (
					this.filter ? paths.filter( this.filter ) : paths
				);

				// Create file entities and cache them
				this._fileEntities = [];
				await this.createFileEntities();

				// Filter and store all paths
				resolve( this._paths );
			})
		})
	}

	protected async createFileEntities ()
	{
		return new Promise( resolve =>
		{
			let remaining = this._paths.length;
			this._paths.map( localPath =>
			{
				// Create complete path from cwd and local path
				const completePath = path.join( this.cwd, localPath );

				// Get file stat to catch real files and directories
				fs.stat( completePath, (err, stats) =>
				{
					// Continue if there are no error
					if (!err)
					{
						// Create concrete file entity from stats
						let fileEntity;
						if ( stats.isFile() )
							fileEntity = new File( completePath, stats );
						else if ( stats.isDirectory() )
							fileEntity = new Folder( completePath, stats );

						// Add it to file entities cache with localPath as key
						this._fileEntities[ localPath ] = fileEntity;
					}

					// Silently file for now
					else
					{
						console.log('TODO error handling in Match.createFileEntities');
					}

					// Count and resolve when every paths are resolved
					if (--remaining == 0) resolve();
				});
			});
		});
	}

	/**
	 * @throws Will throw an error if paths are not updated yet.
	 */
	protected async checkPaths ()
	{
		if (!this._paths)
			await this.update();
		// throw new Error(`Match paths not initialized yet. Please call await update() before trying to access file list with all() files() and folders().`)
	}

	// ------------------------------------------------------------------------- BROWSE

	/**
	 * TODO
	 * @param handler
	 */
	async paths ( handler : PathHandler )
	{
		await this.checkPaths();
		return this._paths.map( handler );
	}

	/**
	 * Browse through all targeted files and folders from glob.
	 * @param handler First argument will be a FileEntity object (File or Folder)
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async all ( handler : EntityHandler )
	{
		await this.checkPaths();
		return this._paths
			.filter( path => path in this._fileEntities )
			.map( path => this._fileEntities[ path ])
			.map( handler );
	}

	/**
	 * Browse through all targeted files (without folders) from glob.
	 * @param handler First argument will be a File object
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async files ( handler : FileHandler )
	{
		await this.checkPaths();
		return this._fileEntities
			.filter( file => file instanceof File )
			.map( handler )
	}

	/**
	 * Browse through all targeted folder (without files) from glob.
	 * @param handler First argument will be a Folder object
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async folders ( handler : FolderHandler )
	{
		await this.checkPaths();
		return this._fileEntities
			.filter( file => file instanceof Folder )
			.map( handler )
	}


	// ------------------------------------------------------------------------- HASH

	/**
	 * Generate hash from current files list.
	 * Will generate another hash if there is other files.
	 * Can generate also a different hash from file last modified or file size.
	 * File list modified is often enough to detect changes in file system.
	 * @param lastModified Add file last modified date for each file into hash signature. Hash will change if any file last modified date changes.
	 * @param size Add file size for each file into hash signature. Hash will change if any file size changes.
	 * @throws Will throw an error if paths are not updated yet.
	 * @return {string} Hex Sga256 Hash from file list and stats.
	 */
	async generateFileListHash ( lastModified = false, size = false )
	{
		this.files( file =>
		{
			console.log(file);
		});

		/*
		// Browse all files
		// and create a hash for this file and add it to the global hash
		this.checkPaths();
		const allFilesHashSignature = this.files( file => (
			// Add file path so if a file is added and all options are set to false
			// global hash still changes.
			file.path
			+ '#'
			// Add last modified timestamp to hash if asked
			+ (lastModified ? file.lastModified() : '')
			+ '#'
			// Add file size to hash if asked
			+ (size ? file.size() : '')
		));

		// Convert all file hashs signature to a big hash
		const crypto = require('crypto');
		const hash = crypto.createHash('sha256');
		hash.update( allFilesHashSignature.join('_') );
		return hash.digest('hex')
	 */
	}
}
