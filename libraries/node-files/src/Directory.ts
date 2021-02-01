import { FileEntity } from './FileEntity'
import { File, FileFinder } from "./_index";
import { TFileType, TGlobOptionsArgument } from "./Struct";
import { type } from "os";


export class Directory extends FileEntity
{
	// ------------------------------------------------------------------------- DIRECTORY TYPED FIND

	static find ( pattern:string, globOptions ?:TGlobOptionsArgument ):Directory[] {
		return FileFinder.find<Directory>( "directory", pattern, globOptions );
	}

	static async findAsync ( pattern:string, globOptions ?:TGlobOptionsArgument ):Promise<Directory[]> {
		return await FileFinder.findAsync<Directory>( "directory", pattern, globOptions );
	}

	// ------------------------------------------------------------------------- CREATE

	/**
	 * Create directory and parents directories if needed.
	 */
	create () {
		// @ts-ignore
		return require('mkdirp').sync( this._path );
	}

	/**
	 * Create directory and parents directories if needed.
	 */
	async createAsync () {
		return new Promise( resolve => require('mkdirp')( this._path, resolve) );
	}

	// ------------------------------------------------------------------------- STATS - SIZE

	/**
	 * Get directory size recursively ( as bytes )
	 * Asynchronous call only.
	 */
	async sizeAsync () {
		return new Promise( resolve => {
			require('get-folder-size')(
				( error, size ) => resolve( error ? 0 : size )
			);
		});
	}

	// ------------------------------------------------------------------------- LIST

	list ( showDotFiles = true, globOptions?:TGlobOptionsArgument ) : string[] {
		return FileFinder.list( '*', { ...globOptions, dot: showDotFiles } );
	}

	async listAsync ( showDotFiles = true, globOptions?:TGlobOptionsArgument ) : Promise<string[]> {
		return await FileFinder.listAsync( '*', { ...globOptions, dot: showDotFiles } );
	}

	// ------------------------------------------------------------------------- CHILDREN

	/**
	 * Match list of direct children file or directories.
	 * @param type Type of file to list. "file", "directory", or "all"
	 * @param showDotFiles If will match dot files. Default is true.
	 * @param globOptions Options passed to glob @see https://www.npmjs.com/package/glob
	 */
	children <G extends FileEntity = (File|Directory)> ( type:TFileType = 'all', showDotFiles = true, globOptions:TGlobOptionsArgument = {} ) : G[] {
		return FileFinder.find( type, '*', { ...globOptions, dot: showDotFiles });
	}

	/**
	 * Match list of direct children file or directories.
	 * @param type Type of file to list. "file", "directory", or "all"
	 * @param showDotFiles If will match dot files. Default is true.
	 * @param globOptions Options passed to glob @see https://www.npmjs.com/package/glob
	 */
	async childrenAsync <G extends FileEntity = (File|Directory)> ( type:TFileType = 'all', showDotFiles = true, globOptions:TGlobOptionsArgument = {} ) : Promise<G[]> {
		return FileFinder.findAsync( type, '*', { ...globOptions, dot: showDotFiles } );
	}

	// ------------------------------------------------------------------------- CLEAN

	/**
	 * Remove every file in this folder
	 */
	async clean ()
	{
		await this.remove();
		await this.create();
	}
}