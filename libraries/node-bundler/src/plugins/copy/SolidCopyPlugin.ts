import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { extractExtensions } from "@solid-js/core"
import path from "path";
import { Directory, File, FileFinder } from "@solid-js/files";

/**
 * TODO v1.2
 * - Possibilité d'avoir les envs dans les chemins de fichier
 *     ex : input: 'server-config/{{env}}.htaccess'
 *     Peut-être un truc plus functional avec e => 'server-config/${e.name}.htaccess'
 *     Comme ça on peut faire des conditions plus complexe
 */

// ----------------------------------------------------------------------------- TEMPLATE EXTENSIONS

/**
 * Here we list all text based file extensions which can be templated.
 * We need this list to binary copy non-templatable files.
 */
export const SolidCopyPlugin_defaultExtensionsToTemplate = [
	'txt', 'json', 'yaml', 'template', 'js', 'php', 'html', 'css',
	'htaccess', 'htpasswd', 'csv', 'ts', 'tsx', 'md', 'gitignore',
	'sh', // ...
]

// ----------------------------------------------------------------------------- STRUCT

interface IFileCopy
{
	from		: string
	to			?:string
	template	?:boolean
}

interface ISolidCopyPluginConfig extends IBaseSolidPluginConfig
{
	paths 							?:(string | IFileCopy)[]
	additionalTemplateProperties	?:object
	extensionsToTemplate			?:string[]
}

const _defaultConfig:Partial<ISolidCopyPluginConfig> = {
	paths 							: [],
	additionalTemplateProperties	: {},
	extensionsToTemplate			: SolidCopyPlugin_defaultExtensionsToTemplate
}

// -----------------------------------------------------------------------------


export class SolidCopyPlugin extends SolidPlugin <ISolidCopyPluginConfig>
{
	static init ( config:ISolidCopyPluginConfig ) {
		return new SolidCopyPlugin({ name: 'copy', ..._defaultConfig, ...config })
	}

	protected _fileCopies:IFileCopy[]

	prepare ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions )
	{
		// Browse config
		this._fileCopies = [];
		this._config.paths.map( filePath => {
			// Convert string paths to IFileCopy
			let fileCopy:IFileCopy
			if ( typeof filePath === 'string' )
				fileCopy = {
					from: filePath
				}

			// Or use IFileCopy from config
			else
				fileCopy = filePath as IFileCopy;

			// Default destination is app output directory
			if ( !fileCopy.to )
				fileCopy.to = appOptions.output

			// If dev didn't gave template instruction
			if ( fileCopy.template === null || fileCopy.template === undefined )
			{
				// Get source file extensions
				const extensions = extractExtensions(
					path.basename(fileCopy.from).toLowerCase()
				)

				// If this is a "templatable" file
				fileCopy.template = (
					extensions.length >= 1
					&& this._config.extensionsToTemplate.indexOf( extensions[0] ) !== -1
				)
			}

			// Add to file copy list
			this._fileCopies.push( fileCopy )
		})
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? )
	{
		// Browse every file / directory to copy
		for ( const copy of this._fileCopies )
		{
			// Convert to file entity
			const fileEntity = FileFinder.createEntityFromPath( copy.from )

			// If it's a file to template
			if ( fileEntity instanceof File && copy.template )
			{
				await fileEntity.loadAsync()
				fileEntity.template({
					...envProps,
					...this._config.additionalTemplateProperties
				})
				await fileEntity.saveAsync( copy.to )
				continue;
			}

			// Can't template a directory
			else if ( fileEntity instanceof Directory && copy.template )
				this.halt('beforeBuild', `{r}Directory can't be templated.`)

			// File without template or directory
			await fileEntity.copyToAsync( copy.to )
		}
	}
}