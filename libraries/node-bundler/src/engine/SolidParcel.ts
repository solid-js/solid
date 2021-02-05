import { SolidPlugin, SolidPluginException } from "./SolidPlugin";
import Parcel from "@parcel/core";
import { nicePrint, printLine, newLine, clearPrintedLoaderLines, printLoaderLine, setLoaderScope } from "@solid-js/cli";
import { File } from "@solid-js/files"
import { delay, noop } from "@solid-js/core"
import path from "path";
import * as logger from "@parcel/logger"

// ----------------------------------------------------------------------------- STRUCT

export type TBuildMode = "production"|"dev"

export type TMiddlewareType = "before"|"after";

export interface IAppOptions
{
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
	 * Public URL is where assets are loaded from source of execution.
	 * For example, if app is starting in /my-app/ and assets are in sub-folder named /assets/
	 * publicURL can be /my-app/assets/ for absolute based targeting, or ./assets/ for relative targeting.
	 */
	publicUrl 			?:string

	/**
	 * App type is what kind of runtime will execute bundle.
	 * For web-browser or node. Default is web.
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
	 * List of all Solid Plugin to execute, in order.
	 */
	plugins				?:SolidPlugin[]

	/**
	 * In hard watch mode, watch will and restarted each time a file changes.
	 * This allow Solid Plugins to have correct before and after, even in watch mode.
	 * Default is true, if you disable it you will only have after middlewares.
	 */
	hardWatch			?:boolean


	/**
	 * Engines object passed to main app target.
	 * @see : https://v2.parceljs.org/plugin-system/api/#Engines
	 * @see https://www.npmjs.com/package/browserslist
	 */
	engines				?: {
		[index:string] : any,
		browsers: string|string[]
	}

	/**
	 * Parcel log level. Default is null to keep Parcel's default.
	 */
	parcelLogLevel		?:"none"|"error"|"warn"|"info"|"verbose"|null
}

// Options after setup, we injected the name so plugins know which app it is
export interface IExtendedAppOptions extends IAppOptions {
	name		:string;
}

// Solid build middleware
export interface ISolidMiddleware {
	beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null
	afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null
}

// ----------------------------------------------------------------------------- ENGINE CLASS

export class SolidParcel
{
	// ------------------------------------------------------------------------- APP SETUP

	// List of all registered apps configurations
	protected static _apps : { [appName:string] : IAppOptions } = {};

	/**
	 * Declare a new app Config.
	 * @param appName Application name, have to be unique.
	 * @param config See IAppOptions
	 */
	static app ( appName:string, config:IAppOptions ) {
		if ( appName in SolidParcel._apps )
			nicePrint(`
				{b/r}App ${appName} is already registered.
			`, {
				code: 1
			});

		SolidParcel._apps[ appName ] = config;
	}

	/**
	 * Get all registered app names
	 */
	static get appNames () { return Object.keys(SolidParcel._apps); }

	// ------------------------------------------------------------------------- PUBLIC BUILD

	/**
	 * Start dev and watch mode.
	 * @param appName Application name to build in dev mode. Have to be declared with SolidParcel.app()
	 * @param envName Dot env file to load. If envName is empty or null, will load '.env'.
	 * 				  Ex : If envName is 'production', it will load '.env.production'.
	 */
	static async dev ( appName:string, envName?:string, disabledPlugins?:string[] ) {
		return await SolidParcel.internalBuild( appName, 'dev', envName);
	}

	/**
	 * Start build in production.
	 * @param appName Application name to build in production mode. Have to be declared with SolidParcel.app()
	 * @param envName Dot env file to load. If envName is empty or null, will load '.env'.
	 * 				  Ex : If envName is 'production', it will load '.env.production'.
	 */
	static async build ( appName:string, envName?:string, disabledPlugins?:string[] ) {
		return await SolidParcel.internalBuild( appName, 'production', envName);
	}

	// ------------------------------------------------------------------------- INTERNAL BUILD

	protected static async internalBuild ( appName:string, buildMode:TBuildMode, dotEnvName?:string, disabledPlugins?:string[] )
	{
		// Check if this app exists
		if ( !SolidParcel._apps[ appName ] )
			nicePrint(`
				{b/r}App ${appName} does not exists.
				{l}Please use {w/i}Solid.app( ... )
			`, {
				code: 1
			});

		// Target current solid app for logs
		if ( SolidParcel.appNames.length > 1 )
			setLoaderScope( appName );

		// Get default parameters
		const appOptionsWithoutDefaults = SolidParcel._apps[ appName ];
		const defaultOutput = `dist/public/static/${appName}/`;
		const appOptions:IExtendedAppOptions = {
			name: appName,

			input: `src/${appName}/*.{ts,tsx}`,
			output: defaultOutput,

			appType: "web",

			root: 'src/',
			publicUrl: path.dirname( appOptionsWithoutDefaults.output ?? defaultOutput ),

			hardWatch: true,

			parcelLogLevel: null,

			engines: {
				browsers: "> 5%",
				...appOptionsWithoutDefaults.engines
			},

			...appOptionsWithoutDefaults
		};

		// Dot env file to load
		const dotEnvPath = '.env' + (dotEnvName ? '.'+dotEnvName : '');
		const dotEnvLoader = printLoaderLine(`Loading ${dotEnvPath}`);

		// Load dot env
		const dotEnvFile = new File( dotEnvPath ).load();
		const envProps = ( dotEnvFile.exists() ? dotEnvFile.dotEnv() : {} );

		// This specific dot env does not exists
		// Do not crash if .env does not exists
		if ( !dotEnvFile.exists() && dotEnvName) {
			dotEnvLoader(`Env file ${dotEnvPath} not found.`, 'error');
			process.exit(2);
		}
		dotEnvLoader(`Loaded ${dotEnvPath}`);

		// Inject envs from passEnvs option
		appOptions.passEnvs && appOptions.passEnvs.map( key => {
			if ( key in process.env )
				envProps[ key ] = process.env[ key ]
		});

		// Start parcel build
		await SolidParcel.bundleParcel( buildMode, appOptions, envProps, disabledPlugins );
	}

	// ------------------------------------------------------------------------- BUILD PARCEL

	protected static bundleParcel = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps?:object, disabledPlugins?:string[]  ) => new Promise<void>( async resolve =>
	{
		// FIXME : For now, parcel follow logLevel only on prod ?
		// FIXME : Or maybe because we have 2 apps ...
		if ( buildMode === 'dev' )
			delete appOptions.parcelLogLevel;

		// Config to booleans
		const isProd = buildMode === 'production';
		const isWeb = appOptions.appType === 'web';
		const isSilent = appOptions.parcelLogLevel === 'none'

		// Build message if parcel is silent
		let _buildingLoader;
		const startBuildProgress = () => {
			_buildingLoader = ( isSilent ? printLoaderLine(`Building for ${buildMode} ...`) : noop );
		}
		const stopBuildProgress = ( error? ) => {
			if ( !isSilent ) {
				isProd && newLine();
				return;
			}
			if ( error ) {
				_buildingLoader(`Error`, 'error');
				console.error( error );
			}
			else
				_buildingLoader(`Built for ${buildMode}`, '🎉');
		}

		// Init parcel config
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
					engines : {
						...appOptions.engines
					}
				}
			},

			//killWorkers: true, // ?

			env: envProps,
			hot: !isProd,

			// --log-level (none/error/warn/info/verbose)
			logLevel: appOptions.parcelLogLevel,

			patchConsole: false, // NOTE : Does not seems to work

			shouldAutoInstall: true,
			autoInstall: true,

			mode: isProd ? 'production' : 'development',
			minify: isProd && isWeb,
			sourceMaps: !isProd
		});

		// Unpatch console each time we setup a new parcel project
		logger.unpatchConsole(); // NOTE : Does not work ?

		// Before build middleware
		await SolidParcel.callMiddleware( "before", buildMode, appOptions, envProps, null, null, disabledPlugins );

		// Build log
		startBuildProgress();

		/**
		 * PRODUCTION
		 */
		if ( isProd )
		{
			// Build and check errors
			let buildEvent, buildError;
			try {
				buildEvent = await bundler.run();
				stopBuildProgress();
			}
			catch ( e ) {
				buildError = e;
				stopBuildProgress( e );
			}

			// After middleware
			await SolidParcel.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError, disabledPlugins );

			// We can now resolve. We need this resolve because the bundler.run does not wait
			resolve();
		}

		/**
		 * DEV + WATCH
		 */
		else
		{
			// Start parcel watcher
			let count = 0;
			const watcher = await bundler.watch( async (buildError, buildEvent) =>
			{
				if ( count == 0 )
					stopBuildProgress();

				count ++;

				// FIXME : Sure about that ? Maybe an option ? watchMode = 'classic'|'complete'|'hard'
				// In regular watch mode, do before middleware now
				if ( !appOptions.hardWatch && count > 1 )
					await SolidParcel.callMiddleware( "before", buildMode, appOptions, envProps, buildEvent, buildError, disabledPlugins );

				// After middleware, only at first build in hardWatch mode because we will restart bundler
				if ( (appOptions.hardWatch && count == 1) || !appOptions.hardWatch )
					await SolidParcel.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError, disabledPlugins );

				// First build, this is not a file change trigger
				if ( count == 1 )
					resolve();

				// Option hard watch will restart parcel bundler after each file change
				// This allow to have before and after middleware correctly called
				if ( appOptions.hardWatch && count == 2) {
					await watcher.unsubscribe();
					clearPrintedLoaderLines();
					SolidParcel.bundleParcel( buildMode, appOptions, envProps, disabledPlugins );
				}
			});
		}
	})

	// ------------------------------------------------------------------------- MIDDLEWARES & PLUGINS

	protected static async callMiddleware ( event:TMiddlewareType, buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps:object, buildEvent?, buildError?, disabledPlugins = [] )
	{
		// Target current solid app building for logs
		if ( SolidParcel.appNames.length > 1 )
			setLoaderScope( appOptions.name );

		// If there are no plugins, do not continue
		if ( !appOptions.plugins ) return;

		// Method name, beforeBuild or afterBuild
		const middlewareName = event+'Build';

		// Call each middleware sequentially
		let currentPlugin
		try {
			for ( currentPlugin of appOptions.plugins ) {
				if ( disabledPlugins.indexOf(currentPlugin.name) !== -1 ) continue;
				await currentPlugin[ middlewareName ]( buildMode, appOptions, envProps, buildEvent, buildError );
			}
		}

		// Oops something bad happened inside a plugin
		catch ( e ) {
			// Uncaught error
			if ( e == null || !(e instanceof SolidPluginException) ) {
				// Show nice message if possible and exit process
				nicePrint(`
					{r} Uncaught error in plugin {b}${currentPlugin?.name ?? 'unknown'}{/}
				`);
				if ( e && typeof e.message === 'string' )
					nicePrint('	{b}'+e.message, { output: 'stderr' } )
				e && console.error( e );
				process.exit(3);
			}

			// Show message
			if ( e.message )
				nicePrint( e.message, { output: 'stderr' } )

			// Show object
			if ( e.object )
				console.error( e );

			// Exit if needed
			if ( e.code > 0 )
				process.exit( e.code );
		}
	}
}
