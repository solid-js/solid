import { SolidPlugin } from "./SolidPlugin";
import Parcel from "@parcel/core";
import { CLICommands, getCLIRoot, nicePrint, printLine, print, newLine } from "@solid-js/cli";
import { File } from "@solid-js/files"
import { delay } from "@solid-js/core"
import path from "path";
import * as logger from "@parcel/logger"

// ----------------------------------------------------------------------------- STRUCT

// export type TBundler = 'parcel'|'tsc'

export type TBuildMode = "production"|"dev"

export type TMiddlewareType = "before"|"after";

export interface IAppOptions
{
	/**
	 * Bundle with
	 * - Parcel, optimized for the web
	 * - TSC (Typescript compiler), optimized for Node based applications
	 */
	//bundler 			?:TBundler,

	/**
	 * List of starting points paths, can be list, can be globs :
	 * Default is `src/${appName}/*.{ts,tsx}`
	 *
	 * ex : 'src/app/index.tsx'
	 * ex : 'src/app/*.tsx'
	 * ex : ['src/app/index.tsx', 'src/app/index.ts']
	 * ex : ['src/app/*.tsx', 'src/app/*.ts']
	 */
	input				?:string|string[]

	/**
	 * Output directory.
	 * Default is `dist/public/static/${appName}/`
	 */
	output				?:string

	/**
	 * Optional, sources root.
	 * Default is 'src/'
	 */
	root				?:string

	/**
	 * TODO
	 */
	publicUrl 			?:string

	/**
	 *
	 */
	appType				?:"web"|"node"

	/**
	 * Pass envs variables from current env to bundle env.
	 * Those envs variables will override .env variables.
	 * Ex : ['API_GATEWAY', 'BASE'] will allow env variables injections when
	 * running : API_GATEWAY='/api/' BASE='/base/' npm run production
	 */
	passEnvs			?:string[]

	/**
	 * TODO TO DEFINE
	 */
	//actions 			?:{ [key:string] : IAction }

	/**
	 * TODO
	 */
	plugins				?:SolidPlugin[]
}

export interface IExtendedAppOptions extends IAppOptions
{
	name		:string;
}

export interface ISolidMiddleware
{
	beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null

	afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null
}

// ----------------------------------------------------------------------------- PRINT SOLID LINE

// Name of the current executing app.
// This will be shown in grey in every solid log
let _currentSolidApp:string

// We count how many lines we draw to clear all after each watch build
const _lineCountersByApp = {};

// Create a log template for solid apps
const solidLineTemplate = ( i, c ) => (
	Solid.appNames.length > 1
	? `${i} {l}- ${_currentSolidApp} -{/} ${c}`
	: `${i} {l}-{/} ${c}`
)

// Clear all printed solid lines for current app
function clearPrintedSolidLines () {
	if ( _currentSolidApp in _lineCountersByApp )
		for ( let i = 0; i < _lineCountersByApp[_currentSolidApp]; i++ ) {
			process.stdout.cursorTo(0, -1)
			process.stdout.clearLine(0);
		}
	_lineCountersByApp[ _currentSolidApp ] = 0;
}

/**
 * Print a solid log, with an icon, current app name shown in grey if multiple apps.
 * Content can be nicePrint formatted.
 */
export function printSolidLine ( icon:string, content:string )
{
	// Init line count for this app name
	if ( !(_currentSolidApp in _lineCountersByApp) )
		_lineCountersByApp[ _currentSolidApp ] = 0;

	// Add a line
	_lineCountersByApp[ _currentSolidApp ] += 1;

	// Format, print line and get clear function
	const clearFunction = printLine( solidLineTemplate(icon, content) );

	// Return clear function to override previous line
	return ( icon:string, content:string ) => {
		clearFunction( solidLineTemplate(icon, content) );
	}
}

// ----------------------------------------------------------------------------- ENGINE CLASS

export class Solid
{
	// If first app, we need a log patch for all but first
	protected static _isFirstApp = true;

	// ------------------------------------------------------------------------- APP SETUP

	// List of all registered apps configurations
	protected static _apps : { [appName:string] : IAppOptions } = {};

	/**
	 * TODO
	 * @param appName
	 * @param config
	 */
	static app ( appName:string, config:IAppOptions ) {
		Solid._apps[ appName ] = config;
	}

	/**
	 * Get all registered app names
	 */
	static get appNames () { return Object.keys(Solid._apps); }

	// ------------------------------------------------------------------------- BUILD

	static async dev ( appName:string, envName?:string ) {
		return await Solid.internalBuild( appName, 'dev', envName);
	}

	static async build ( appName:string, envName?:string ) {
		return await Solid.internalBuild( appName, 'production', envName);
	}

	/**
	 * TODO
	 * @param appName
	 * @param buildMode
	 * @param dotEnvName
	 */
	protected static async internalBuild ( appName:string, buildMode:TBuildMode, dotEnvName?:string )
	{
		if ( !Solid._apps[ appName ] )
			nicePrint(`
				{b/r}App ${appName} does not exists.
				{l}Please use {w/i}Solid.app( ... )
			`, {
				code: 1
			});

		_currentSolidApp = appName;

		const appOptionsWithoutDefaults = Solid._apps[ appName ];
		const defaultOutput = `dist/public/static/${appName}/`;
		const appOptions:IExtendedAppOptions = {
			name: appName,

			input: `src/${appName}/*.{ts,tsx}`,
			output: defaultOutput,

			appType: "web",

			root: 'src/',
			publicUrl: path.dirname( appOptionsWithoutDefaults.output ?? defaultOutput ),

			...appOptionsWithoutDefaults
		};

		// Dot env file to load
		const dotEnvPath = '.env' + (dotEnvName ? '.'+dotEnvName : '');
		const dotEnvLoading = printSolidLine("⚙️", `Loading ${dotEnvPath}`);

		// Load dot env
		const dotEnvFile = new File( dotEnvPath ).load();
		const envProps = ( dotEnvFile.exists() ? dotEnvFile.dotEnv() : {} );

		// This specific dot env does not exists
		// Do not crash if .env does not exists
		if ( !dotEnvFile.exists() && dotEnvName) {
			dotEnvLoading("❌", `Env file ${dotEnvPath} not found.`);
			process.exit(2);
		}
		dotEnvLoading("👍", `Loaded ${dotEnvPath}`);

		// Inject envs from passEnvs option
		// FIXME : To test
		appOptions.passEnvs && appOptions.passEnvs.map( key => {
			if ( key in process.env )
				envProps[ key ] = process.env[ key ]
		});

		//console.log(envProps);

		await Solid.bundleParcel( buildMode, appOptions, envProps );
	}

	// ------------------------------------------------------------------------- BUILD PARCEL

	protected static bundleParcel = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps?:object ) => new Promise<void>( async resolve =>
	{
		const isProd = buildMode === 'production';
		const isWeb = appOptions.appType === 'web';

		const initBundleLine = printSolidLine('😰', `Warming up ...`);
		await delay(.05);

		const bundler = new Parcel({
			entries: appOptions.input,
			entryRoot: appOptions.root,

			targets: {
				// https://v2.parceljs.org/plugin-system/api/#PackageTargetDescriptor
				app: {
					// Optimization and dev options
					minify: isProd && isWeb,
					sourceMap: !isProd,
					scopeHoist: true,

					// Output dir
					distDir: appOptions.output,
					publicUrl: appOptions.publicUrl,

					// Context and format options
					// https://v2.parceljs.org/plugin-system/api/#EnvironmentContext
					context: ( isWeb ? 'browser' : 'node' ),
					// https://v2.parceljs.org/plugin-system/api/#OutputFormat
					outputFormat: ( isWeb ? 'global' : 'commonjs' ),

					// TODO : Add to config or read package.json ?
					//engines: {
					//	browsers: "> 5%"
					//}
				}
			},

			//killWorkers: true, // ?

			env: envProps,
			hot: !isProd,

			//patchConsole: false, // NOTE : Does not works
			//disableCache: isProd,
			disableCache: false,

			mode: isProd ? 'production' : 'development',
			minify: isProd && isWeb,
			sourceMaps: !isProd
		})

		initBundleLine('😁', 'Ready');

		// Patch, we need to add a line if not first app to show
		if (!Solid._isFirstApp) newLine();
		Solid._isFirstApp = false;

		// Unpatch console each time we setup a new parcel project
		logger.unpatchConsole();

		if ( isProd )
		{
			await Solid.callMiddleware( "before", buildMode, appOptions, envProps );

			let buildEvent, buildError;
			try {
				buildEvent = await bundler.run();
			}
			catch ( e ) {
				buildError = e;
			}

			await Solid.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError );

			resolve();
		}
		else
		{
			await Solid.callMiddleware( "before", buildMode, appOptions, envProps );

			// TODO : Hard reset as an option
			let count = 0;
			const watcher = await bundler.watch( async (buildError, buildEvent) => {
				//console.log(buildError, buildEvent)

				if ( ++count == 1 ) {
					await Solid.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError );
					resolve();
				}
				else {
					await watcher.unsubscribe();
					clearPrintedSolidLines();
					Solid.bundleParcel( buildMode, appOptions, envProps );
				}
			});
		}
	})

	// ------------------------------------------------------------------------- MIDDLEWARES & PLUGINS

	protected static async callMiddleware ( event:TMiddlewareType, buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps:object, buildEvent?, buildError?  )
	{
		_currentSolidApp = appOptions.name;

		if ( !appOptions.plugins ) return;

		const middlewareName = event+'Build';

		for ( const plugin of appOptions.plugins )
			await plugin[ middlewareName ]( buildMode, appOptions, envProps, buildEvent, buildError );
	}
}
