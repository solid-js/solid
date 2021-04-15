import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { removeExtensions, upperCaseFirst } from "@solid-js/core";
import { File } from "@solid-js/files";
import path from "path";
import { printLoaderLine } from "@solid-js/cli";

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

	async prepare ()
	{
		this._paths = []
		this._config.paths.map( exportableConfig => {
			this._paths.push({
				..._defaultExportable,
				...exportableConfig
			})
		})

		// Generate exportables before build start
		for ( let exportable of this._paths )
			await this.generateExportable( exportable )
	}

	// FIXME : For now exportables are generated at first build only, not on watch
	// FIXME : Not really useful to implement because we need to exit dev mode to scaffold

	// async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? )
	// {
	// 	// Only build on watch changes, first build was made in prepare
	// 	if ( !buildEvent ) return;
	//
	// 	const changedAssetResolvedPaths = getChangedAssetsPathsFromBuildEvent( buildEvent )
	//
	// 	// if ( changedAssetResolvedPaths.length > 1 )
	// 	// {
	// 	// 	console.log('EXPORTABLE DO NOT CONTINUE ALL');
	// 	// 	return;
	// 	// }
	//
	// 	for ( const exportable of this._paths )
	// 	{
	// 		const outputResolvePath = path.resolve( exportable.output )
	// 		if ( changedAssetResolvedPaths.indexOf(outputResolvePath) !== -1 ) {
	// 			console.log('EXPORTABLE DO NOT CONTINUE ' + exportable.input);
	// 			await delay(2)
	// 			continue;
	// 		}
	//
	// 		await this.generateExportable( exportable )
	// 	}
	// }

	async generateExportable ( exportable:IExportable )
	{
		const exportableLoader = printLoaderLine(`Generating exportable ${path.basename(exportable.output)} ...`);

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

		exportableLoader(`Generated exportable ${path.basename(exportable.output)}`, 'ok')
	}
}