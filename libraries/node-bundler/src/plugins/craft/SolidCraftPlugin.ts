import { IBaseSolidPluginConfig, ICommand, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, SolidParcel } from "../../engine/SolidParcel";
import { File } from "@solid-js/files"
import { askList, CLICommands, printLoaderLine } from "@solid-js/cli";
import { removeExtensions } from "@solid-js/core";
const path = require('path')

/**
 * TODO : V1.1
 * - Crafter file name can be in config
 * - Better types in crafter.js file, how to do that ?
 */

/**
 * TODO : V1.2
 * - Add option to craft outside of package root ?
 * - Create crafter repo with :
 *    - Solid Preact
 *    - Solid Yadl
 *    - Solid Fastify
 *    - Solid plate fields for WP ACF Field files ?
 */

// -----------------------------------------------------------------------------

interface ISolidCraftPluginConfig extends IBaseSolidPluginConfig
{
	paths			:string[]
	templateProps	?:object
	exposeCommand	?:string
}

const _defaultConfig:Partial<ISolidCraftPluginConfig> = {
	templateProps	: {},
	exposeCommand	: 'craft'
}

interface ICrafterModuleInit
{
	name : string
	menu : {
		[index:string] : string
	}
	_crafterPath ?:string
}
interface ICrafterModuleMethods
{
	[index:string] : ( craft, appOptions:IExtendedAppOptions ) => any
}
type TCrafterModule = ( ICrafterModuleInit & ICrafterModuleMethods )

// ----------------------------------------------------------------------------- CONFIG

const _crafterFile = 'crafter.js'

// ----------------------------------------------------------------------------- PLUGIN CLASS

export class SolidCraftPlugin extends SolidPlugin <ISolidCraftPluginConfig>
{
	static init ( config:ISolidCraftPluginConfig ) {
		return new SolidCraftPlugin({ name: 'craft', ..._defaultConfig, ...config })
	}

	// If we already init cli craft command
	static __cliCommandInit = false

	// List of available crafters
	protected _crafters : { [name:string] : TCrafterModule };

	// ------------------------------------------------------------------------- INIT

	init ()
	{
		// Class bug ? Need to init here ...
		if (!this._crafters)
			this._crafters = {}

		// No crafter paths
		if ( !this._config.paths || this._config.paths.length == 0 )
			this.halt('init', `{r}Please add path(s) to crafter file(s).`)

		// Browse all crafters paths and register them
		this._config.paths.map( craftPath => {
			// Path to crafter file, from cwd
			const pathToCraftFile = path.join( craftPath, _crafterFile )
			const craftFiles = File.find( pathToCraftFile )

			// File not found
			if ( craftFiles.length == 0 )
				this.halt('init', `{r}Crafter file {b/r}${ pathToCraftFile }{/}{r} not found.`)

			// Path to crafter module (from root, for require)
			const crafterModulePath = removeExtensions(path.join(process.cwd(), pathToCraftFile))
			const crafterModule = require( crafterModulePath )

			// Check if we have a name
			if ( typeof crafterModule.name !== 'string')
				this.halt('init', `{r}Crafter module {b/r}${ pathToCraftFile }{/}{r} invalid.
				{r}Missing {b/r}name{/}{r} export as string.`)

			// Check if we have a menu
			if ( typeof crafterModule.menu !== 'object')
				this.halt('init', `{r}Crafter module {b/r}${ pathToCraftFile }{/}{r} invalid.
				{r}Missing {b/r}menu{/}{r} export as an object.`)

			// Save crafter directory so it can target templates relatively
			crafterModule._crafterPath = path.dirname(pathToCraftFile)

			// Register crafter by its name
			this._crafters[ crafterModule.name ] = crafterModule;
		})

		// Expose CLI Command
		// (only once if we have several apps)
		if ( SolidCraftPlugin.__cliCommandInit || !this._config.exposeCommand ) return
		SolidCraftPlugin.__cliCommandInit = true
		CLICommands.add(this._config.exposeCommand, async ( args, options ) => {
			const parameters = {
				crafter: args[0] ?? null,
			}
			await SolidParcel.action('craft', parameters, options.app)
		}, { app: null })
	}

	// ------------------------------------------------------------------------- CRAFT ACTION

	async action ( command:ICommand, appOptions?:IExtendedAppOptions )
	{
		if ( command.command != 'craft' ) return

		const crafterKeys = Object.keys( this._crafters )
		const crafterName = (command.parameters['crafter'] as string ?? '')

		// Only one crafter, select it
		let selectedCrafter:TCrafterModule;
		if ( crafterKeys.length == 1 )
			selectedCrafter = this._crafters[ crafterKeys[0] ]

		// Get crafter from parameters
		else if ( crafterName in this._crafters )
			selectedCrafter = this._crafters[ crafterName ]

		// Crafter not found, ask which to select
		if ( !selectedCrafter ) {
			const crafterChoice = await askList( 'Which crafter  ?', crafterKeys )
			selectedCrafter = this._crafters[ crafterChoice[1] ]
		}

		// Show crafter menu
		const craftEntity = await askList('What do you want to craft ?', selectedCrafter.menu)

		// Thunk craft to add some parameters from this scope
		const craftThunk = ( properties, files ) => {
			this.craft( selectedCrafter._crafterPath, properties, files, appOptions )
		}
		await selectedCrafter[ craftEntity[2] ]( craftThunk, appOptions )
	}

	/**
	 * Craft list of files from templates
	 * @param crafterPath Path to crafter directory so it can load template relatively
	 * @param properties Properties injected into template sources
	 * @param files List of function which returns template source and generated file destination.
	 * 				Template path starts from crafter file.
	 * 				File destination starts from app packageRoot (@see IAppOptions doc)
	 * @param appOptions App options of current crafted app.
	 */
	craft = async <G extends object> ( crafterPath:string, properties:G, files:( (p:G, crafterPath?:string) => string[]|Promise<any>|void)[], appOptions?:IExtendedAppOptions ) =>
	{
		const generateLoader = printLoaderLine(`Generating files ...`)

		// Get app options
		if ( !appOptions )
			this.halt('halt', `{r}AppOptions parameter missing`)

		// Browse files to generate
		const generatedFiles = []
		for ( const file of files )
		{
			// Execute crafter file
			const fileReturn = await file( properties, crafterPath )

			// Check return type, if its not a tuple
			if (
				// Void
				!fileReturn
				// Promise
				|| fileReturn instanceof Promise
				// Array but not a tuple
				|| (Array.isArray(fileReturn) && fileReturn.length != 2)
			) {
				generatedFiles.push('')
				continue;
			}

			// Get from path and to path
			const [ from, to ] = fileReturn

			// Check if to path is not already existing
			if ( File.find(to).length != 0 )
				this.halt('craft', `File ${to} already exists`)

			// Target template file from crafter
			const templateFile = new File( path.join(crafterPath, from) )
			await templateFile.loadAsync()
			if (!(await templateFile.existsAsync()))
				this.halt('craft', `Template ${from} not found relatively to ${crafterPath}`)

			// Template from path with properties and save it to to path
			templateFile.template( properties )
			await templateFile.saveAsync( path.join(appOptions.packageRoot, to) )
			generatedFiles.push( to )
		}

		// Finished
		const t = generatedFiles.length
		generateLoader(`{g/b}${t} file${t > 1 ? 's' : ''} generated.`)
		return generatedFiles;
	}
}