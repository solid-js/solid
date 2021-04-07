import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { File } from "@solid-js/files";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { delay, extractExtensions, removeExtensions } from "@solid-js/core";
import { getChangedAssetsFromBuildEvent } from "../../engine/SolidUtils";
import { printLoaderLine } from "@solid-js/cli";
const path = require('path')

/**
 * TODO v1.2
 * - Build fails in dev mode if we remove an atom
 */

// -----------------------------------------------------------------------------

interface ISolidAtomizerPluginConfig extends IBaseSolidPluginConfig
{
	paths			:string|string[]
	generateTSFile 	?:boolean
}

const _defaultConfig:Partial<ISolidAtomizerPluginConfig> = {
	// path	: 'src/app/0-atoms/atoms.module.less',
	generateTSFile: true
}

// -----------------------------------------------------------------------------

// Min build duration in seconds, to avoid watch loops
const _watchLoopTimeDelta = 3;

// -----------------------------------------------------------------------------

export class SolidAtomizerPlugin extends SolidPlugin <ISolidAtomizerPluginConfig>
{
	static init ( config:ISolidAtomizerPluginConfig ) {
		return new SolidAtomizerPlugin({ name: 'atoms', ..._defaultConfig, ...config })
	}

	protected _paths:string[]

	protected _previouslyUpdatedAtomFiles = {}

	async init ()
	{
		this._paths = (
			typeof this._config.paths === 'string'
			? [ this._config.paths ]
			: this._config.paths
		)

		// Check if atom paths are valid
		this._paths.map( filePath => {
			// File must exists
			if ( File.find(filePath).length == 0 )
				this.halt('init', `{r}Atom file ${filePath} not found.`)

			// File have to be a .module.less file
			const extensions = extractExtensions(
				path.basename( filePath ).toLowerCase()
			)
			if ( extensions.length < 2 || extensions[0] != 'less' || extensions[1] != 'module' )
				this.halt('init', `{r}Atom file must be a .module.less file.`)
		})
	}

	async prepare ()
	{
		// Atomize before build start to generate ts file
		// which can be a coupled dependency in other project files
		for ( let atomFilePath of this._paths )
			await this.atomize( path.resolve( atomFilePath ) )
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? )
	{
		// Only build on watch changes, first build was made in prepare
		if ( !buildEvent ) return;

		const changedAssetResolvedPaths = getChangedAssetsFromBuildEvent( buildEvent )

		// SPECIAL CASE :
		// If atom file is a module, it seems that it never appears in changed assets list.
		// But the files which import atom file, will appear in list.
		// With solid framework, we have a good hint that if index.less changed, atoms file changed.
		// FIXME : Patch this or do it better, this is where solid middlewares are not powerful enough
		const forceIndexRebuild = changedAssetResolvedPaths.filter( f => (
			f.indexOf('index.less') !== -1 || f.indexOf('index.module.less') !== -1
		)).length > 0

		for ( let atomFilePath of this._paths )
		{
			atomFilePath = path.resolve( atomFilePath );

			if ( !forceIndexRebuild && changedAssetResolvedPaths.filter( f => f == atomFilePath).length === 0 ) {
				// console.log('ATOM DO NOT CONTINUE 1' + atomFilePath);
				// await delay(2)
				break;
			}

			// Atom file has been updated by atomizer
			if ( atomFilePath in this._previouslyUpdatedAtomFiles )
			{
				// If last atomizer update was no that long ago
				// We need to prevent atomizing to avoid watch loop
				const deltaTime = Date.now() - this._previouslyUpdatedAtomFiles[ atomFilePath ]
				if ( deltaTime < _watchLoopTimeDelta * 1000 ) {
					// Here break and do not continue because we do not want
					// loop if typescript file changed also
					// console.log('ATOM DO NOT CONTINUE 2' + atomFilePath);
					break;
				}
			}

			// Atomize and remember time to avoid watch loop
			this._previouslyUpdatedAtomFiles[ atomFilePath ] = Date.now()
			await delay(1)
			await this.atomize( atomFilePath )
		}
	}

	async atomize ( filePath:string )
	{
		const atomizeLoader = printLoaderLine(`Atomizing ${path.basename(filePath)} ...`);

		// Load atoms module file
		const atomLessFile = new File( filePath );
		await atomLessFile.loadAsync()

		// Read file as text and split lines
		// Remove extra spaces
		const lines = (
			(atomLessFile.content() as string).split("\n" )
			.map( line => line.trim() )
		);

		// Get all variable assigment statements
		const variables = (
			lines
			// Only keep lines which use variables
			.filter( line => (line.indexOf('@') === 0) )
			.map( line => (
				// Split variable name and value
				line.split(':', 2)
				// Remove comments, commas, and trim spaces
				.map( part => (
					part.split('//', 2)[0].split(';', 2)[0].trim()
				))
			))
			// Only keep assigment statements
			.filter( parts => parts.length === 2 )
		);

		// Get pre-existing export statement line number
		let exportStartLine = lines
			.map( (line, i) => (line.indexOf(':export') !== -1 ? i : -1) )
			.filter( l => (l !== -1) )[0];

		let exportEndLine = -1;
		if ( exportStartLine == null )
		{
			// Not existing so we add at end of file
			exportStartLine = lines.length - 1;
			exportEndLine = exportStartLine;
		}
		else
		{
			// Get end of export statement line number
			lines.map( (line, i) => {
				if ( exportEndLine >= 0 || i < exportStartLine ) return;
				if ( line.indexOf('}') === -1 ) return;
				exportEndLine = i;
			});

			// Roll back to comments on top of :export statement
			while ( exportStartLine > 0 && lines[ exportStartLine - 1 ].trim().indexOf('//') === 0 )
				exportStartLine --;
		}

		// Generate export statement with all variables and a warning comment
		const exportStatement = [
			'// Do not edit code bellow this line.',
			'// This statement is automated.',
			':export {',
			...variables.map( parts => {
				return `	${parts[0].substr(1, parts[0].length)}: ${parts[0]};`;
			}),
			'}'
		];

		// Browse all existing lines to create new lines with export statement added
		const newLines = [];
		let exportStatementAlreadyDone = false;
		lines.map( (line, i) => {
			// If we are in pre-existing export statement
			if ( i >= exportStartLine && i <= exportEndLine )
			{
				// Only add once (we can have several lines in previous pre-existing statement)
				if ( !exportStatementAlreadyDone )
				{
					// Add all export statement lines
					exportStatement.map( exportLine => newLines.push(exportLine) )
					exportStatementAlreadyDone = true;
				}
				return;
			}
			newLines.push( line );
		});

		// Save new lines to atom files
		atomLessFile.content( newLines.join("\n") );
		await atomLessFile.save();

		if ( this._config.generateTSFile )
		{
			// Get property names and generated ts file
			const properties = variables.map( variableSet => variableSet[0].substr(1, variableSet[0].length) )
			await this.generateTSFile( properties, filePath )
		}

		atomizeLoader(`Atomized ${path.basename(filePath)}`, 'ok')
	}

	async generateTSFile ( properties:string[], atomFilePath:string )
	{
		// Generate typescript file path
		let typescriptFileName = removeExtensions( path.basename( atomFilePath ).toLowerCase(), 2 )
		typescriptFileName += '.ts'
		const typescriptFilePath = path.join(path.dirname( atomFilePath), typescriptFileName);

		// Template this file and save it along atom file
		const typescriptFile = new File( typescriptFilePath )
		typescriptFile.content( require('./atoms-template') )
		typescriptFile.template({
			atomFilePath: './'+path.basename(atomFilePath),
			properties: properties.map( p => `'${p}'`).join('|')
		})
		typescriptFile.save()
	}
}