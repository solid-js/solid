import { IBaseSolidPluginConfig, ICommand, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, SolidParcel } from "../../engine/SolidParcel";
import { File } from "@solid-js/files"
import { askList, CLICommands, nicePrint, printLoaderLine } from "@solid-js/cli";
import { removeExtensions } from "@solid-js/core";
const path = require('path')

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

	// App options for current craft action
	protected _appOptions : IExtendedAppOptions


	protected error ( message:string, method = 'init', code = 1 ) {
		nicePrint(`{b/r}SolidCraftPlugin.${method} error : \n${message}`, { code })
	}

	// ------------------------------------------------------------------------- INIT

	init ()
	{
		// Class bug ? Need to init here ...
		if (!this._crafters)
			this._crafters = {}

		// No crafter paths
		if ( !this._config.paths || this._config.paths.length == 0 )
			this.error(`{r}Please add path(s) to crafter file(s).`)

		// Browse all crafters paths and register them
		this._config.paths.map( craftPath => {
			// Path to crafter file, from cwd
			const pathToCraftFile = path.join( craftPath, _crafterFile )
			const craftFiles = File.find( pathToCraftFile )

			// File not found
			if ( craftFiles.length == 0 )
				this.error(`{r}Crafter file {b/r}${ pathToCraftFile }{/}{r} not found.`)

			// Path to crafter module (from root, for require)
			const crafterModulePath = removeExtensions(path.join(process.cwd(), pathToCraftFile))
			const crafterModule = require( crafterModulePath )

			// Check if we have a name
			if ( typeof crafterModule.name !== 'string')
				this.error(`{r}Crafter module {b/r}${ pathToCraftFile }{/}{r} invalid.
				{r}Missing {b/r}name{/}{r} export as string.`)

			// Check if we have a menu
			if ( typeof crafterModule.menu !== 'object')
				this.error(`{r}Crafter module {b/r}${ pathToCraftFile }{/}{r} invalid.
				{r}Missing {b/r}menu{/}{r} export as an object.`)

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

		// Save app options in instance so crafter does not need to handle it
		this._appOptions = appOptions
		await selectedCrafter[ craftEntity[2] ]( this.craft, appOptions )
		this._appOptions = null
	}

	/**
	 * Craft list of files from templates
	 * @param properties Properties injected into template sources
	 * @param files List of function which returns template source and generated file destination.
	 * 				Template path starts from crafter file.
	 * 				File destination starts from app packageRoot (@see IAppOptions doc)
	 * @param appOptions App options of current crafted app.
	 */
	craft = async <G extends object> ( properties:G, files:( (p:G) => string[])[], appOptions?:IExtendedAppOptions ) =>
	{
		const generateLoader = printLoaderLine(`Generating files ...`)

		// Get app options
		if ( !appOptions )
			appOptions = this._appOptions
		if ( !appOptions )
			this.error(`{r}AppOptions parameter missing`, 'craft')

		// Browse files to generate
		const generatedFiles = []
		for ( const file of files )
		{
			// Get from path and to path
			const [ from, to ] = await file( properties )

			// Check if to path is not already existing
			if ( File.find(to).length != 0 )
				this.error(`File ${to} already exists`, 'craft')

			// Template from path with properties and save it to to path
			const templateFile = new File( from )
			templateFile.template( properties )
			// FIXME : Add option to craft outside of package root ?
			await templateFile.saveAsync( path.join(appOptions.packageRoot, to) )
			generatedFiles.push( to )
		}
		const t = generatedFiles.length
		generateLoader(`{g/b}${t} file${t > 1 ? 's' : ''} generated.`)
		return generatedFiles;
	}
}