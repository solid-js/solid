import { FileEntity } from './FileEntity'
import * as fs from "fs";
import { TContentArgument, TGlobOptionsArgument, TRawWritableContent, TStructuralWritableContent } from "./Struct";
import { FileFinder } from "./FileFinder";
import { ScalarObject, ScalarValue, TFunctionalFilter } from "@solid-js/core";
import { DotEnvParser, JSON5Parser, YAMLParser } from "./FileParsers";
import { resolveHome } from "./_index";


export class File extends FileEntity
{
	// ------------------------------------------------------------------------- FILE TYPED FIND

	static find ( pattern:string, globOptions ?:TGlobOptionsArgument ):File[] {
		return FileFinder.find<File>( "file", pattern, globOptions );
	}

	static async findAsync ( pattern:string, globOptions ?:TGlobOptionsArgument ):Promise<File[]> {
		return await FileFinder.findAsync<File>( "file", pattern, globOptions );
	}

	// ------------------------------------------------------------------------- DATA & ENCODING

	/**
	 * File content as string.
	 */
	protected _data			:string = null;
	get data ():string { return this._data; }

	/**
	 * Read and write encoding for this file.
	 * Default is node default ("utf8").
	 * @see Node doc to know more about supported encodings.
	 */
	encoding:BufferEncoding;

	// ------------------------------------------------------------------------- READ FILE

	/**
	 * Read and update file data synchronously.
	 * Will read data on drive and put them as string in data.
	 * Will fail silently and get empty string if file can't be accessed.
	 */
	load () {
		if ( !this._stats )
			this.update();

		try {
			this._data = fs.readFileSync( this._path, { encoding: this.encoding } ).toString();
		}
		catch (e) {
			this._data = '';
		}
		return this;
	}

	/**
	 * Read and update file data asynchronously.
	 * Will read data on drive and put them as string in data.
     * Will fail silently and get empty string if file can't be accessed.
	 */
	async loadAsync () {
		if ( !this._stats )
			await this.updateAsync();

		try {
			this._data = (await fs.promises.readFile( this._path, { encoding: this.encoding } )).toString();
		}
		catch (e) {
		    this._data = '';
        }
	}

	// ------------------------------------------------------------------------- CHECK LOAD

	protected checkLoadSync () {
		if ( this._data === null )
			this.load();
	}

	// ------------------------------------------------------------------------- CREATE EMPTY FILE

	/**
	 * Create empty file if not existing and parents directories if needed.
	 * @param force if true, will empty currently existing file.
	 */
	create ( force = true ) {
		// Create parent folders
		this.ensureParents();

		// Do not create empty file if file already exists
		this.update();
		if ( this.exists() && !force ) return;

		// Create empty file and mark data as loaded
		this._data = '';
		this.save();
	}

	/**
	 * Create empty file if not existing and parents directories if needed.
	 * @param force if true, will empty currently existing file.
	 */
	async createAsync ( force = true ) {
		// Create parent folders
		await this.ensureParentsAsync();

		// Do not create empty file if file already exists
		await this.updateAsync();
		if ( await this.existsAsync() && !force ) return;

		// Create empty file and mark data as loaded
		this._data = '';
		await this.saveAsync();
	}

	// ------------------------------------------------------------------------- STATS - SIZE

	/**
	 * Get file size ( as bytes )
	 */
	size ():number|false {
		this.update();
		return this._exists && this._stats.size;
	}

	/**
	 * Get file size ( as bytes )
	 */
	async sizeAsync ():Promise<number|false> {
		await this.updateAsync();
		return this._exists && this._stats.size;
	}

    // ------------------------------------------------------------------------- WRITE

    /**
     * Write content to file. A new path can be given to keep original file.
     * @param newPath Change path to keep original file.
     */
    async save ( newPath?:string )
    {
        // Do not save file that were never loaded.
        if ( this._data == null ) return;

        // Save this content to a new file
        if ( newPath ) {
        	this._path = await this.safeTo( newPath );
        	this.updateFileProperties();
		}

        // Save data
        await fs.promises.writeFile( this._path, this._data, { encoding: this.encoding } );
    }

    /**
     * Write content to file. A new path can be given to keep original file.
     * @param newPath Change path to keep original file.
     */
    async saveAsync ( newPath?:string )
    {
    	// Patch home dir
		newPath = resolveHome( newPath );

        // Do not save file that were never loaded.
        if ( this._data == null ) return;

        // Save this content to a new file
        if ( newPath ) {
        	this._path = await this.safeTo( newPath );
			this.updateFileProperties();
		}

		// Save data
        await fs.writeFileSync( this._path, this._data, { encoding: this.encoding } );
    }

	// ------------------------------------------------------------------------- PROCESS AND PARSE DATA

	protected processData <G> ( content : null|G|TFunctionalFilter<G>, decode:(source:string) => G, encode:(data:G) => string ) : G|File
	{
		this.checkLoadSync();

		const type = typeof content;
		let dataToStore:string;

		// No content is passed
		// Read data from file and return it, no chaining here
		if ( type === 'undefined' )
			return decode( this._data );

		// Content is a function.
		// Call handler, pass it current file data, get back file data
		else if ( type === 'function' )
			dataToStore = encode(
				(content as any)( decode(this._data) )
			);

		// We have data to save so we encode
		else
			dataToStore = encode( content as G );

		// Save raw data
		if ( dataToStore != null )
			this._data = dataToStore as string;

		return this;
	}

	// ------------------------------------------------------------------------- RAW CONTENT PARSING

	/**
	 * Append content at end of file.
	 * @param content Content to add ( numbers and booleans will be converted to string )
	 * @param newLine New line character to add before content. Set as empty string to append without new line.
	 */
	append ( content ?: TRawWritableContent, newLine = '\n' ) {
		this.checkLoadSync();
		this._data += newLine + content;
	}

	/**
	 * TODO DOC
	 * @param content
	 */
	content ( content ?: TContentArgument<TRawWritableContent>) {
		return this.processData<TRawWritableContent>( content, d => d, d => d + '' );
	}

	// ------------------------------------------------------------------------- OBJECTS PARSING

	json ( content ?: TContentArgument<any>, spaces = 2, replacers = null )
	{
		return this.processData<any>(
			content,
			b => JSON.parse( b ),
			d => JSON.stringify( d, replacers, spaces )
		)
	}

	json5 ( content ?: TContentArgument<any>, spaces = 2, replacers = null )
	{
		return this.processData<any>(
			content,
			b => JSON5Parser().decode( b ),
			d => JSON5Parser().encode( d, replacers, spaces )
		)
	}

	yaml ( content ?: TContentArgument<any> )
	{
		return this.processData<any>(
			content,
			b => YAMLParser().decode( b ),
			d => YAMLParser().encode( d )
		)
	}

	dotEnv ( content ?: TContentArgument<ScalarObject> )
	{
		return this.processData<ScalarObject>(
			content,
			b => DotEnvParser().decode( b ),
			d => DotEnvParser().encode( d )
		);
	}

	// ------------------------------------------------------------------------- LINE BASED MANAGEMENT

	/**
	 * TODO DOC
	 * TODO TEST
	 * TODO : Un replace qui est une fonction qui passe la ligne identifiée en entrée et attend la nouvelle ligne en sortie
	 * @param startOrNumber
	 * @param replaceBy
	 *//*
	line ( startOrNumber?: string | number, replaceBy ?: string )
	{
		// Split content in lines
		const lines = this._data.split("\n");
		const totalLines = lines.length;

		// Return total lines count if no parameters sent
		if ( startOrNumber == null ) return totalLines;

		// If we need to treat lines by number
		if ( typeof startOrNumber === 'number' )
		{
			// Count backward if line number is negative
			// -1 is the last line, -2 the line before, etc ...
			if ( startOrNumber < 0 )
				startOrNumber = totalLines + startOrNumber;

			// Replace string and return chain
			if ( replaceBy != null )
			{
				// TODO opt with line 362
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content or null
			else return ( startOrNumber in lines ) ? lines[ startOrNumber ] : null;
		}

		// Otherwise treat lines by starting identification
		let currentLine:string;
		for ( let i = 0; i < lines.length; i ++ )
		{
			// Get current line content
			currentLine = lines[ i ];

			// Continue to search if not starting with startOrNumber
			// TODO : Less strict find ? Whitespaces ?
			if ( currentLine.indexOf(startOrNumber) === -1 ) continue;

			// Replace string and return chain
			if ( replaceBy != null )
			{
				// TODO opt with line 336
				lines[ startOrNumber ] = replaceBy;
				this._data = lines.join("\n");
				return this;
			}

			// Return found line content
			else return lines[ startOrNumber ]
		}

		// Return awaited default type
		return replaceBy != null ? this : null;
	}*/

	/*removeLines ( lineNumbers:number|number[] )
	{
		if ( typeof lineNumbers == 'number' )
			lineNumbers = [ lineNumbers ];

		// Split content in lines
		let lines = this._data.split("\n");
		const totalLines = lines.length;

		lines = lines.filter( (line, i) => {
			const lineIndex = ( i < 0 ? totalLines - i : i );
			return (lineNumbers as number[]).indexOf( lineIndex ) !== 0;
		});

		this._data = lines.join("\n");
		return this;
	}*/

	//
	/**
	 * TODO : lines, same as line but with mutli-lines optimisations
	 * Par example, ajouter '-> ' au début de chaque ligne :
	 * lines('*', content => '->' + content);
	 */

	// ------------------------------------------------------------------------- REPLACE & TEMPLATE

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param search
	 * @param replace
	 */
	replace ( search:string|RegExp, replace:ScalarValue )
	{
		this.checkLoadSync();
		this._data = this._data.replace( search, replace + '' );
		return this;
	}

	/**
	 * TODO DOC
	 * TODO TEST
	 * @param values
	 */
	template ( values:object|ScalarObject )
	{
		this.checkLoadSync();
        this._data = require('@solid-js/nanostache').Nanostache( this._data, values );
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
