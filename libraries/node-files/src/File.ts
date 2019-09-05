import { FileEntity } from './FileEntity'
import * as fs from "fs";
import * as path from "path";
import {TFunctionalTransformer, ScalarObject, ScalarValue} from "./Global";
import {Stats} from "fs";


// Default writable content are Scalar values ( everything that do not hold structure )
// string / number / boolean
type TRawWritableContent = ScalarValue | null
type TRawContentArgument = TRawWritableContent | TFunctionalTransformer <TRawWritableContent>

// JSON writable are Scalar values but also objects or arrays
type TJSONWritableContent = ScalarValue | object | any[]
type TJSONContentArgument = TJSONWritableContent | TFunctionalTransformer <TJSONWritableContent>

/**
 * TODO DOC
 * @param filePath
 * @param cwd
 * @constructor
 */
export function F$ ( filePath:string, cwd?:string ):File
{
	cwd = cwd || process.cwd();
	const fullPath = path.join( cwd, filePath );
	return new File( fullPath );
}


export class File extends FileEntity
{
	/**
	 * File stats ( size, last modified date, stuff like that ).
	 * Call await File.updateStats() to update stats from disk.
	 */
	protected _stats			:fs.Stats;
	get stats ():Stats { return this._stats; }

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
	 * Update file stats ( size, last modified date, stuff like that ).
	 * Stats will be available in File.stats or through specific methods ( like lastModified() )
	 */
	async updateStats ():Promise<Stats>
	{
		try
		{
			this._stats = await fs.promises.stat( this.path );
		}
		// Fail silently here
		catch (e) {  }

		return this._stats;
	}

	/**
	 * Update file data. Will read data on drive and put them as string in File.data
	 */
	async updateData ():Promise<TRawWritableContent>
	{
		try
		{
			const buffer = await fs.promises.readFile(  this.path, { encoding: this.encoding } );
			this._data = buffer.toString();
		}
		// Fail silently here
		catch (e) {  }

		return this._data;
	}

	// ------------------------------------------------------------------------- CHECKS

	/**
	 * Check stats availability and request file stats from disk if needed.
	 */
	protected async checkStats ()
	{
		if (!this._stats) await this.updateStats();
	}

	/**
	 * Check data availability and request file data from disk if needed.
	 */
	protected async checkData ()
	{
		if (!this._data) await this.updateData();
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
	 * Get last modified file size ( as bytes )
	 */
	async size ()
	{
		await this.checkStats();
		return this._stats.size;
	}

	// TODO : Human readable stats

	/*
	lastModifiedHuman ()
	{

	}
	sizeHuman ()
	{

	}
	*/

	// ------------------------------------------------------------------------- RAW & JSON CONTENT

	/**
	 * TODO DOC
	 * @param content
	 */
	content ( content ?: TRawContentArgument ) : File|TRawWritableContent
	{
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
		this._data += newLine + content;
	}

	/**
	 * TODO DOC
	 * @param content
	 * @param spaces
	 * @param replacers
	 */
	json ( content ?: TJSONContentArgument, spaces = 2, replacers = null ) : File|TJSONWritableContent
	{
		const type = typeof content;

		let jsonDataToSave:TJSONWritableContent;

		// Read data from file and return it, no chaining here
		if ( type === 'undefined' )
			return JSON.parse( this._data )

		else if ( type === 'function' )
		{
			// Parse loaded JSON data
			// TODO : Handle parse errors ?
			let jsonData = JSON.parse( this._data );

			// Call handler, pass it current file data, get back file data
			jsonDataToSave = (content as TFunctionalTransformer <TJSONWritableContent>)( jsonData );
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
		// Save this content to a new file
		if (newPath) this._path = newPath;
		await fs.promises.writeFile( this._path, this._data, { encoding: this.encoding } );
	}

	// ------------------------------------------------------------------------- ALTER

	/*
	TODO : IMPL
	search ( search: (string|number|((r) => any)) )
	{

	}
	*/

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param startOrNumber
	 * @param replaceBy
	 */
	line ( startOrNumber: string | number, replaceBy ?: string )
	{
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
		this._data = this._data.replace( search, replace + '' );
	}

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param values
	 * @param delimiters
	 */
	template ( values:ScalarObject, delimiters = ["{{", "}}"] )
	{
		// Replace all detected mustache fields
		this._data = this._data.replace(
			new RegExp(`${delimiters[0]}(.*?)${delimiters[1]}`, 'gm'),
			(i, match) => values[ match ] + ''
		);
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
