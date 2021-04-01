import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { File } from "@solid-js/files";
import { nicePrint } from "@solid-js/cli";
const path = require('path')

// -----------------------------------------------------------------------------

interface ISolidAtomizerPluginConfig extends IBaseSolidPluginConfig
{
	path	:string|string[]
	// mode	?:'eof'|'json'|'ts'

	// TODO : Publish a .ts file with property list
}

const _defaultConfig:Partial<ISolidAtomizerPluginConfig> = {
	// path	: 'src/app/0-atoms/atoms.module.less',
	// mode	: 'eof'
}

// -----------------------------------------------------------------------------

let _config:ISolidAtomizerPluginConfig;

export class SolidAtomizerPlugin extends SolidPlugin <ISolidAtomizerPluginConfig>
{
	static init ( config:ISolidAtomizerPluginConfig ) {
		return new SolidAtomizerPlugin({ name: 'atoms', ..._defaultConfig, ...config })
	}

	protected _paths:string[]

	init ()
	{
		this._paths = (
			typeof this._config.path === 'string'
			? [ this._config.path ]
			: this._config.path
		)

		// Check if atom paths are valid
		this._paths.map( filePath => {
			// File must exists
			if ( File.find(filePath).length == 0 )
				// TODO : Normalize plugin errors in SolidPlugin class
				nicePrint(`{b/r}SolidAtomizerPlugin.init
				Atom file ${filePath} not found.`, { code : 1 })

			// File have to be a .module.less file
			const parts = path.basename( filePath ).toLowerCase().split('.')
			if ( parts.length < 3 || parts[ parts.length - 1 ] != 'less' || parts[ parts.length - 2 ] != 'module' )
				nicePrint(`{b/r}SolidAtomizerPlugin.init
				Atom file must be a .module.less file.`, { code: 1 })
		})
	}

	async beforeBuild ()
	{
		for ( const filePath of this._paths )
			await this.atomize( filePath )
	}

	async atomize ( filePath:string )
	{
		// Load atoms module file
		const file = new File( filePath );
		await file.loadAsync()

		// Read file as text and split lines
		// Remove extra spaces
		const lines = (
			(file.content() as string).split("\n" )
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
			'// This statement is build automated.',
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
		file.content( newLines.join("\n") );
		await file.save();
	}
}