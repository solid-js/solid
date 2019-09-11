import { FileEntity } from './FileEntity'
import * as path from "path";
import {IFilter, Match} from "./Match";


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
	/**
	 * Create directory and parents directories if needed.
	 */
	async create ()
	{
		return new Promise( resolve => require('mkdirp')( this._path, resolve) );
	}

	/**
	 * Get last modified timestamp ( as ms )
	 */
	async lastModified ()
	{
		await this.checkStats();
		return this._stats.mtimeMs;
	}

	/**
	 * Get directory size recursively ( as bytes )
	 */
	async size ()
	{
		return new Promise( resolve =>
		{
			require('get-folder-size')(
				( error, size ) => resolve( error ? 0 : size )
			);
		});
	}

	/**
	 * Match list of direct children file and directories.
	 * Warning, can return undirect children if pattern is modified.
	 * @param pattern Pattern to match, default is *
	 * @param showDotFiles If will match dot files. Default is true.
	 * @param filter Filter function to filter some files. Useful to simplify glob pattern.
	 * @param globOptions Options passed to glob @see https://www.npmjs.com/package/glob
	 */
	async children ( pattern = '*', showDotFiles = true, filter?:IFilter, globOptions? )
	{
		const options = { dot: showDotFiles, ...globOptions };
		return new Match( pattern, this._path, filter, options );
	}

	/**
	 * Remove every file in this folder
	 */
	async clean ()
	{
		await this.remove();
		await this.create();
	}
}