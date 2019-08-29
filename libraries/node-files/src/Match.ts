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
	updatePaths ():Promise<string[]>
	{
		return new Promise( (resolve, reject) =>
		{
			// Reject if any update is already running on this match
			if ( this._isUpdating )
			{
				reject( new Error( 'Match already updating.' ) );
				return
			}

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

				// Filter and store all paths
				resolve( this._paths );
			})
		})
	}

	/**
	 * Convert all paths to File and Folders.
	 * Call it to update state from file system.
	 * Will get paths from glob if needed.
	 */
	updateFileEntities ():Promise<FileEntity[]>
	{
		return new Promise( async (resolve, reject) =>
		{
			// Reject if any update is already running on this match
			if ( this._isUpdating )
			{
				reject( new Error( 'Match already updating.' ) );
				return
			}


			// Get paths from glob if needed
			await this.checkPaths();

			this._isUpdating = true;

			// New file entities map
			this._fileEntities = [];

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
					if ( --remaining == 0 )
					{
						this._isUpdating = false;
						resolve( this._fileEntities );
					}
				});
			});
		});
	}

	/**
	 * Check if paths are available.
	 * If not, will call updatePaths to browse file list from glob.
	 */
	protected async checkPaths ()
	{
		if (!this._paths) await this.updatePaths();
	}

	/**
	 * Check if file entities are available.
	 * If not, will call updateFileEntities to convert all paths to File and Folder objects.
	 */
	protected async checkFileEntities ()
	{
		if (!this._fileEntities) await this.updateFileEntities();
	}

	/**
	 * Get list of file entities.
	 * Will get paths if needed
	 * Will create file entities if needed
	 */
	protected async getFileEntities ()
	{
		// Wait file entities
		await this.checkFileEntities();

		// Browse paths, remove untrackable file entities and return file entities
		return this._paths
			.filter( path => path in this._fileEntities )
			.map( path => this._fileEntities[ path ])
	}

	/**
	 * Await for async handler and map to promised result, or return sync results directly.
	 * @param resultsFromHandler List of promises or list of anything else
	 */
	protected async patchReturnedPromises ( resultsFromHandler )
	{
		return (
			// If we have a promise on first result, wait for all promises
			( resultsFromHandler.length > 0 && resultsFromHandler[0] instanceof Promise )
			? await Promise.all(resultsFromHandler)
			// Otherwise return results directly
			: resultsFromHandler
		);
	}

	// ------------------------------------------------------------------------- BROWSE

	/**
	 * Get all paths from glob. No File or Folder object returned, only strings.
	 */
	async paths ( handler : PathHandler )
	{
		// Wait for paths
		await this.checkPaths();

		// Call handler on every path
		const resultsFromHandler = this._paths.map( handler );

		// Wait if handler is async
		return await this.patchReturnedPromises( resultsFromHandler );
	}

	/**
	 * Browse through all targeted files and folders from glob.
	 * @param handler First argument will be a FileEntity object (File or Folder)
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async all ( handler : EntityHandler )
	{
		// Wait file entities
		const entities = await this.getFileEntities();

		// Call handler on files and folders
		const resultsFromHandler = entities.map( handler );

		// Wait if handler is async
		return await this.patchReturnedPromises( resultsFromHandler );
	}

	/**
	 * Browse through all targeted files (without folders) from glob.
	 * @param handler First argument will be a File object
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async files ( handler : FileHandler )
	{
		// Wait file entities
		const entities = await this.getFileEntities();

		// Filter for files and call handler
		const resultsFromHandler = entities
			.filter( file => file instanceof File )
			.map( handler );

		// Wait if handler is async
		return await this.patchReturnedPromises( resultsFromHandler );
	}

	/**
	 * Browse through all targeted folder (without files) from glob.
	 * @param handler First argument will be a Folder object
	 * @throws Will throw an error if paths are not updated yet.
	 */
	async folders ( handler : FolderHandler )
	{
		// Wait file entities
		const entities = await this.getFileEntities();

		// Filter for folder and call handler
		const resultsFromHandler = entities
			.filter( file => file instanceof Folder )
			.map( handler );

		// Wait if handler is async
		return await this.patchReturnedPromises( resultsFromHandler );
	}


	// ------------------------------------------------------------------------- HASH

	/**
	 * Generate hash from current files list.
	 * Will generate another hash if total files or file names changes.
	 * Can generate also a different hash from file last modified or file size.
	 * File list modified is often enough to detect changes in file system.
	 * @param lastModified Add file last modified date for each file into hash signature. Hash will change if any file last modified date changes.
	 * @param size Add file size for each file into hash signature. Hash will change if any file size changes.
	 * @param hashIt Set to false to return file descriptors without hashing it
	 * @throws Will throw an error if paths are not updated yet.
	 * @return {string} Hex Sga256 Hash from file list and stats.
	 */
	async generateFileListHash ( lastModified = false, size = false, hashIt = true )
	{
		const fileDescriptors = (
			// Describe state only with paths to avoid useless stats
			( !lastModified && !size )
			? await this.paths( r => r )
			// Get files with stats to add last modified and size info to the hash
			: await this.files( async file => {
				let fileDescriptor = file.path;
				if (lastModified)	fileDescriptor += '#' + await file.lastModified();
				if (size)			fileDescriptor += '#' + await file.size();
				return fileDescriptor;
			})
		);

		// Return without hashing it
		if (!hashIt) return fileDescriptors.join('_');

		// Convert all file hashs signature to a big hash
		const crypto = require('crypto');
		const hash = crypto.createHash('sha256');
		hash.update( fileDescriptors.join('_') );
		return hash.digest('hex');
	}
}
