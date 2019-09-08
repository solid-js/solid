import { FileEntity } from './FileEntity'
import * as fs from "fs";
import * as path from "path";
import {TFunctionalTransformer, ScalarObject, ScalarValue} from "./Global";


// Default writable content are Scalar values ( everything that do not hold structure )
// string / number / boolean
type TRawWritableContent = ScalarValue | null
type TRawContentArgument = TRawWritableContent | TFunctionalTransformer <TRawWritableContent>

// Structural contents are Scalar values but also objects or arrays
type TStructuralWritableContent = ScalarValue | object | any[]
type TStructuralContentArgument = TStructuralWritableContent | TFunctionalTransformer <TStructuralWritableContent>

// Quick helper to create YAML parser which keep comments and structure
const YAML = (raw) =>
{
	const YAWN = require('yawn-yaml/cjs');
	return new YAWN( raw );
};

/**
 * TODO DOC
 * @param filePath
 * @param cwd
 * @constructor
 */
export function F ( filePath:string, cwd?:string ):File
{
	cwd = cwd || process.cwd();
	const fullPath = path.join( cwd, filePath );
	return new File( fullPath );
}


export class File extends FileEntity
{
	/**
	 * File content as string.
	 * Call await File.updateData() to update content from disk.
	 */
	protected _data			:string;
	get data ():string { return this._data; }

	// TODO : Update lock for stats and data ?

	/**
	 * Read and write encoding for this file.
	 * Default is node default ("utf8").
	 * @see Node doc to know more about supported encodings.
	 */
	encoding:string;


	// ------------------------------------------------------------------------- UPDATES

	/**
	 * Update file data. Will read data on drive and put them as string in File.data.
     * Will fail silently and get empty string if file can't be accessed.
	 */
	async updateData ():Promise<TRawWritableContent>
	{
		try {
			this._data = await fs.promises.readFile( this._path, { encoding: this.encoding } ).toString();
		}
		catch (e) {
		    this._data = '';
        }

		return this._data;
	}

    /**
     * Update file data synchronously. Prefer usage of await updateData().
     * Will fail silently and get empty string if file can't be accessed.
     */
	updateDataSync ():string
	{
	    try {
		    this._data = fs.readFileSync( this._path, { encoding: this.encoding }).toString();
        }
        catch (e) {
            this._data = '';
        }

		return this._data;
	}

    /**
     * Check if file has been loaded and load synchronously if needed.
     */
	protected checkDataSync ()
	{
		if (this._data == null) this.updateDataSync();
	}


	// ------------------------------------------------------------------------- FS ACTIONS

	/**
	 * Create empty file if not existing and parents directories if needed.
	 */
	async create ()
	{
		return new Promise( resolve =>
		{
			// Create parent directories if needed
			require('mkdirp')( path.basename( this._path ), async ( error ) =>
			{
				// Do not continue if there was an error creating folders
				if (error) return resolve();

				// Do not create empty file if file already exists
				await this.checkStats();
				if ( this.exists() ) return resolve();

				// Create empty file and mark data as loaded
				this._data = "";
				await this.write();
				resolve();
			});
		})
	}

	// ------------------------------------------------------------------------- STATS

	/**
	 * Get last modified timestamp ( as ms )
	 */
	async lastModified ()
	{
		await this.checkStats();
		return this._stats.mtimeMs;
	}

	/**
	 * Get file size ( as bytes )
	 */
	async size ()
	{
		await this.checkStats();
		return this._stats.size;
	}

    // ------------------------------------------------------------------------- READ / WRITE

    /**
     * Read file content from disk.
     * @param handler Will be called with file as first argument.
     */
    async read ( handler ?: (file:File) => any|void ):Promise<string>
    {
        await this.updateData();
        handler && await handler( this );
        return this._data;
    }

    /**
     * Save content to file. A new path can be given to keep original file.
     * @param newPath Change path to keep original file.
     */
    async write ( newPath?:string )
    {
        // Do not save file that were never loaded.
        if (this._data == null) return;

        // Save this content to a new file
        if (newPath) this._path = newPath;
        await fs.promises.writeFile( this._path, this._data, { encoding: this.encoding } );
    }

	// ------------------------------------------------------------------------- RAW & JSON CONTENT

	/**
	 * TODO DOC
	 * @param content
	 */
	content ( content ?: TRawContentArgument ) : File|TRawWritableContent
	{
		this.checkDataSync();

		const type = typeof content;

		let rawDataToSave:TRawWritableContent;

		// No content is passed
		// Read data from file and return it, no chaining here
		if ( type === 'undefined' )
			return this._data;

		// Content is a function.
		// Call handler, pass it current file data, get back file data
		else if ( type === 'function' )
			rawDataToSave = (content as TFunctionalTransformer <TRawWritableContent>)( this._data );

		// Type is string, no need to cast
		else if ( type === 'string' )
			rawDataToSave = content as string;

		// Save content and try to cast as string
		// Can be 'number' or 'bigint' for example
		else
			rawDataToSave = content + '';

		// Save raw data
		if ( rawDataToSave != null )
			this._data = rawDataToSave as string;

		// Return this object to allow chaining
		return this
	}

	/**
	 * Append content at end of file.
	 * @param content Content to add ( numbers and booleans will be converted to string )
	 * @param newLine New line character to add before content. Set as empty string to append without new line.
	 */
	append ( content ?: TRawWritableContent, newLine = '\n' )
	{
		this.checkDataSync();
		this._data += newLine + content;
	}

	/**
	 * TODO DOC
	 * @param content
	 * @param spaces
	 * @param replacers
	 */
	json (content ?: TStructuralContentArgument, spaces = 2, replacers = null ) : File|TStructuralWritableContent
	{
		this.checkDataSync();
		const type = typeof content;

		let jsonDataToSave:TStructuralWritableContent;

		// Read data from file and return it, no chaining here
		if ( type === 'undefined' )
			return JSON.parse( this._data );

		else if ( type === 'function' )
		{
			// Parse loaded JSON data
			// TODO : Handle parse errors ?
			let jsonData = JSON.parse( this._data );

			// Call handler, pass it current file data, get back file data
			jsonDataToSave = (content as TFunctionalTransformer <TStructuralWritableContent>)( jsonData );
		}

		// Save anything else ( object / string / number ... )
		else
			jsonDataToSave = content;

		// Save JSON data
		if ( jsonDataToSave != null )
		{
			// Write back json data to raw data
			this._data = JSON.stringify( jsonDataToSave, replacers, spaces );
		}

		// Return this object to allow chaining
		return this;
	}

	/**
	 * TODO
	 */
	yaml ( content ?: TStructuralContentArgument ) : File|TStructuralWritableContent
	{
		this.checkDataSync();

		const type = typeof content;

		let yamlDataToSave;

		// Read data from file, parse YAML, and return it, no chaining here
		if ( type === 'undefined' )
		{
			return YAML( this._data ).json;
		}
		else if ( type === 'function' )
		{
			// Parse loaded YAML data
			// TODO : Handle parse errors ?
			yamlDataToSave = YAML( this._data );

			// Call handler, pass it current file data, get back file data
			yamlDataToSave.json = (content as TFunctionalTransformer <TStructuralWritableContent>)( yamlDataToSave.json );
		}
		else
		{
			// Save anything else ( object / string / number ... )
			yamlDataToSave = YAML('');
			yamlDataToSave.json = content;
		}

		// Write back yaml data to raw data
		this._data = yamlDataToSave.yaml;

		// Return this object to allow chaining
		return this;
	}

	// ------------------------------------------------------------------------- ALTER

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param startOrNumber
	 * @param replaceBy
	 */
	line ( startOrNumber: string | number, replaceBy ?: string )
	{
		this.checkDataSync();

		// Split content in lines
		const lines = this._data.split("\n");

		// If we need to treat lines by number
		if ( typeof startOrNumber === 'number' )
		{
			// Replace string and return chain
			if ( replaceBy != null )
			{
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content or null
			else return ( startOrNumber in lines ) ? lines[ startOrNumber ] : null;
		}

		// Otherwise treat lines by starting

		// Browse all lines
		let currentLine:string;
		for ( let i = 0; i < lines.length; i ++ )
		{
			// Get current line content
			currentLine = lines[ i ];

			// Continue to search if not starting with startOrNumber
			// TODO : Less strict find ? Whitespaces ?
			if ( currentLine.indexOf(startOrNumber) !== 0 ) continue;

			// Replace string and return chain
			if ( replaceBy != null )
			{
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content
			else return lines[ startOrNumber ]
		}

		// Return awaited default type
		return replaceBy != null ? this : null;
	}

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param search
	 * @param replace
	 */
	replace ( search:string|RegExp, replace:ScalarValue )
	{
		this.checkDataSync();
		this._data = this._data.replace( search, replace + '' );
	}

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param values
	 */
	template ( values:ScalarObject )
	{
	    this.checkDataSync();
        this._data = require('@solid-js/nanostache')( this._data, values );
        return this;
	}

	// ------------------------------------------------------------------------- DESTRUCT

	dispose ()
	{
		// TODO ...
		delete this.encoding;
		delete this._data;
		delete this._stats;
	}
}
