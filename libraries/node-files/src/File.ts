import { FileEntity } from './FileEntity'
import { defaultTemplateMarkers } from './index'
import { Stats } from 'fs'
import * as fs from 'fs'


type functionalHandler<GType> = ( r:GType ) => GType

type rawWritableContent = string | number
type rawContentArgument = rawWritableContent | functionalHandler<rawWritableContent>



export class File extends FileEntity
{
	_stats:Stats;
	_data:any;

	protected init ()
	{
	}

	async update ()
	{
		return new Promise( (resolve, reject) =>
		{
			fs.stat( this.path, (error, stats) =>
			{
				if ( error )
				{
					reject( error );
					return
				}

				this._stats = stats;
				resolve();
			})
		})
	}

	protected async checkStats ()
	{
		if (!this._stats)
			await this.update();
	}

	/*
	async updateData ():Promise<string>
	{

	}
	*/

	async lastModified ()
	{
		await this.checkStats();
		return this._stats.mtimeMs;
	}

	lastModifiedHuman ()
	{

	}

	async size ()
	{
		await this.checkStats();
		return this._stats.size;
	}

	sizeHuman ()
	{

	}

	content ( content ?: rawContentArgument )
	{
		const type = typeof content
		if ( type == 'undefined' )
		{
			// TODO UPDATE DATA
			return this._data
		}
		else if ( type == 'function' )
		{
			// TODO UPDATE DATA
			this._data = (content as functionalHandler<rawWritableContent>)( this._data )
		}
		else
		{
			this._data = content
		}
	}

	json ( content ?: (any | ((r) => any)) )
	{
		const type = typeof content

		if ( type === 'undefined' )
		{
			// TODO UPDATE DATA
			return JSON.parse( this._data )
		}
		else if ( type === 'function' )
		{
			// TODO UPDATE DATA
			this._data = content( this._data )
		}
		else
		{
			this._data = content;
		}

		return this;
	}

	search ( search: (string|number|((r) => any)) )
	{

	}

	replace ( search, replace )
	{

	}

	template (data:any, markers:string[] = defaultTemplateMarkers)
	{

	}

	write ()
	{

	}
	save () { return this.write() }
}
