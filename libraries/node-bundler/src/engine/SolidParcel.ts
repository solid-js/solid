import { SolidPlugin } from "./SolidPlugin";
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
	 * TODO
	 */
	publicUrl 			?:string

	/**
	 * TODO
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
	 * TODO
	 */
	plugins				?:SolidPlugin[]

	/**
	 * TODO
	 */
	hardWatch			?:boolean


	parcelLogLevel		?:"none"|"error"|"warn"|"info"|"verbose"
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

// ----------------------------------------------------------------------------- PRINT SOLID LINE

// TODO -> GOTO NODE-CLI

// ----------------------------------------------------------------------------- ENGINE CLASS

export class SolidParcel
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
		SolidParcel._apps[ appName ] = config;
	}

	/**
	 * Get all registered app names
	 */
	static get appNames () { return Object.keys(SolidParcel._apps); }

	// ------------------------------------------------------------------------- BUILD

	static async dev ( appName:string, envName?:string ) {
		return await SolidParcel.internalBuild( appName, 'dev', envName);
	}

	static async build ( appName:string, envName?:string ) {
		return await SolidParcel.internalBuild( appName, 'production', envName);
	}

	/**
	 * TODO
	 * @param appName
	 * @param buildMode
	 * @param dotEnvName
	 */
	protected static async internalBuild ( appName:string, buildMode:TBuildMode, dotEnvName?:string )
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
		await SolidParcel.bundleParcel( buildMode, appOptions, envProps );
	}

	// ------------------------------------------------------------------------- BUILD PARCEL

	/**
	 * TODO
	 * @param buildMode
	 * @param appOptions
	 * @param envProps
	 */
	protected static bundleParcel = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps?:object ) => new Promise<void>( async resolve =>
	{
		// FIXME : For now, parcel follow logLevel only on prod ?
		// FIXME : Or maybe because we have 2 apps ...
		if ( buildMode === 'dev')
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
					//engines: {
					//	browsers: "> 5%"
					//}
				}
			},

			//killWorkers: true, // ?

			env: envProps,
			hot: !isProd,

			// --log-level (none/error/warn/info/verbose)
			logLevel: appOptions.parcelLogLevel,

			// patchConsole: false, // NOTE : Does not works
			// disableCache: isProd,
			// disableCache: false,

			mode: isProd ? 'production' : 'development',
			minify: isProd && isWeb,
			sourceMaps: !isProd
		});

		// Patch, we need to add a line if not first app to show
		//if ( !SolidParcel._isFirstApp ) newLine();
		//SolidParcel._isFirstApp = false;

		// Unpatch console each time we setup a new parcel project
		//logger.unpatchConsole(); // Does not work ?

		// Before build middleware
		await SolidParcel.callMiddleware( "before", buildMode, appOptions, envProps );

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
			await SolidParcel.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError );

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

				// After middleware, only at first build in hardWatch mode because we will restart bundler
				if ( (appOptions.hardWatch && count == 1) || !appOptions.hardWatch )
					await SolidParcel.callMiddleware( "after", buildMode, appOptions, envProps, buildEvent, buildError );

				// First build, this is not a file change trigger
				if ( count == 1 )
					resolve();

				// Option hard watch will restart parcel bundler after each file change
				// This allow to have before and after middleware correctly called
				if ( appOptions.hardWatch && count == 2) {
					await watcher.unsubscribe();
					clearPrintedLoaderLines();
					SolidParcel.bundleParcel( buildMode, appOptions, envProps );
				}
			});
		}
	})

	// ------------------------------------------------------------------------- MIDDLEWARES & PLUGINS

	/**
	 * Middleware calling system
	 * @param event Type of middleware event. Before or after
	 * @param buildMode
	 * @param appOptions
	 * @param envProps
	 * @param buildEvent
	 * @param buildError
	 * @protected
	 */
	protected static async callMiddleware ( event:TMiddlewareType, buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps:object, buildEvent?, buildError?  )
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
			for ( currentPlugin of appOptions.plugins )
				await currentPlugin[ middlewareName ]( buildMode, appOptions, envProps, buildEvent, buildError );
		}
		catch (e) {
			// FIXME : Explain error better ?
			nicePrint(`
				{r} Error on plugin {b}${currentPlugin?.name ?? 'unknown'}{/}
			`);
			process.exit(3);
		}
	}
}
