import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { removeExtensions, upperCaseFirst } from "@solid-js/core";
import { File, FileFinder } from "@solid-js/files";
import path from "path";

/**
 * TODO v1.1
 * - Check if output has glob-star and halt
 */

// -----------------------------------------------------------------------------

interface IExportable
{
	input			:string
	output			:string
	thunk			?:boolean
	addExtension	?:boolean
	importer		?: 'require'|'import'|null
}

interface ISolidExportablePluginConfig extends IBaseSolidPluginConfig
{
	paths : IExportable[]
}

const _defaultConfig:Partial<ISolidExportablePluginConfig> = {}

const _defaultExportable:Partial<IExportable> = {
	thunk			: true,
	addExtension	: false,
}

// -----------------------------------------------------------------------------

const generateImport = file => `'${file.name}' : ${file.thunk ? '() => ' : ''} ${file.importer}('${ file.extension ? file.path : removeExtensions(file.path) }')`;

const generatedTemplate = (name, files) => `// Auto-generated, do not edit
export const Exportable${name} = {
    ${ files.map( generateImport ).join(',\n\t') }
};
export type TExportable${name}Keys = ${ files.map( f => `'${f.name}'`).join('|') ?? "''" };
`;

// -----------------------------------------------------------------------------

export class SolidExportablePlugin extends SolidPlugin <ISolidExportablePluginConfig>
{
	static init ( config:ISolidExportablePluginConfig ) {
		return new SolidExportablePlugin({ name: 'exportable', ..._defaultConfig, ...config })
	}

	protected _paths : IExportable[]

	prepare ()
	{
		this._paths = []
		this._config.paths.map( exportableConfig => {
			this._paths.push({
				..._defaultExportable,
				...exportableConfig
			})
		})
	}

	async beforeBuild ()
	{
		for ( const exportable of this._paths )
		{
			const exportedFiles = [];
			const files = await File.findAsync( path.resolve(exportable.input) )
			for ( const file of files )
			{
				// Get default importer from options
				let importer;
				if ( exportable.importer )
					importer = exportable.importer;

				// Or try to read file to get importer
				else
				{
					importer = 'require';
					await file.loadAsync();
					(file.content() as string).split('\n').map( line => {
						if ( line.indexOf('// @exportable') !== 0 ) return;
						importer = line.substr(line.indexOf(':')+1, line.length).trim().toLowerCase();
					});
				}

				// Add this file to the list
				exportedFiles.push({
					name: file.name,
					path: './'+path.relative(path.dirname( exportable.output ), file.path),
					...exportable,
					importer
				});
			}

			// Generated file
			const generatedFile = new File( exportable.output )
			await generatedFile.loadAsync()
			const upperCaseName = upperCaseFirst( generatedFile.name )
			const content = generatedTemplate( upperCaseName, exportedFiles )
			generatedFile.content( content )
			await generatedFile.saveAsync()
		}
	}
}