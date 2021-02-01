import { Directory, File } from "./_index";
import { FileEntity } from "./FileEntity";
import { TFileType, TGlobOptionsArgument } from "./Struct";
const glob = require('glob');
import * as fs from "fs";

// ----------------------------------------------------------------------------- STRUCT

export class FileFinder
{
	// ------------------------------------------------------------------------- LIST

	static list ( pattern:string, globOptions ?:TGlobOptionsArgument ) : string[]
	{
		// @ts-ignore
		return glob.sync( pattern, globOptions );
	}

	static listAsync ( pattern:string, globOptions ?:TGlobOptionsArgument ) : Promise<string[]>
	{
		return new Promise( (resolve, reject) => {
			glob( pattern, globOptions, ( error, paths ) => {
				error ? reject( error ) : resolve( paths );
			})
		});
	}

	// ------------------------------------------------------------------------- FIND

	static find <G extends FileEntity = (File|Directory)> ( type:TFileType, pattern:string, globOptions ?:TGlobOptionsArgument ) : G[]
	{
		return FileFinder.list( pattern, globOptions )
			.map( path => FileFinder.createEntityFromPath( path ) as unknown as G )
			.filter( fileEntity => FileFinder.isFileEntityTypeOf(fileEntity, type) )
	}

	static async findAsync <G extends FileEntity> ( type:TFileType, pattern:string, globOptions ?:TGlobOptionsArgument ) : Promise<G[]>
	{
		const paths = await FileFinder.list( pattern, globOptions );
		const allEntities:G[] = await Promise.all( paths.map(
			async path => await FileFinder.createEntityFromPathAsync( path ) as unknown as G
		))
		return allEntities.filter( fileEntity => FileFinder.isFileEntityTypeOf(fileEntity, type) );
	}

	// ------------------------------------------------------------------------- FILE ENTITY TYPE CHECK

	static isFileEntityTypeOf ( fileEntity:FileEntity, fileType:TFileType ):boolean
	{
		return fileEntity != null && (
			( fileType == 'directory' && fileEntity.isDirectory() )
			|| ( fileType == 'file' && fileEntity.isFile() )
			|| ( fileType == 'all' )
		)
	}

	// ------------------------------------------------------------------------- CREATE ENTITY

	static createFileEntityFromStat ( filePath:string, fileStat:fs.Stats ):File|Directory
	{
		if ( fileStat.isFile() )
			return new File( filePath, fileStat )

		else if ( fileStat.isDirectory() )
			return new Directory( filePath, fileStat )

		else return null
	}

	static createEntityFromPath ( filePath:string ):File|Directory
	{
		const fileStat = fs.statSync( filePath );
		return FileFinder.createFileEntityFromStat( filePath, fileStat );
	}

	static async createEntityFromPathAsync ( filePath:string ):Promise<File|Directory>
	{
		const fileStat = await fs.promises.stat( filePath )
		return FileFinder.createFileEntityFromStat( filePath, fileStat );
	}
}