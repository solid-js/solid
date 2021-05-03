import { ICommand, SolidPlugin, SolidPluginException, TMiddlewareType } from "./SolidPlugin";
import {
	nicePrint, newLine, printLoaderLine, setLoaderScope,
	execAsync, onProcessKilled, onProcessError
} from "@solid-js/cli";
import { Directory, File, FileFinder } from "@solid-js/files"
import { delay, noop } from "@solid-js/core"
import Parcel from "@parcel/core";
import path from "path";

// ----------------------------------------------------------------------------- CONFIG

// Parcel cache directory path
const parcelCacheDirectoryName = '.parcel-cache';

// Solid cache directory
const solidCacheDirectoryName = '.solid-cache';

// Target a solid cache object
export function targetSolidParcelCacheObject ( appName:string, ...objects) {
	return path.join( solidCacheDirectoryName, appName, ...objects );
}

// ----------------------------------------------------------------------------- CLEAN EXIT & ASSET GRAPH SAVING

// Load parcel modules for cache management
require('v8-compile-cache');
import { NodePackageManager } from '@parcel/package-manager';
import { NodeFS } from '@parcel/fs';
const parcelEvents = require("@parcel/events");

// Running watchers unsubscribers and disposables directories
const _unsubscribeHandler = {}
const _disposables = {}

// Clean exit current program
async function cleanExit ( buildMode:TBuildMode, code = 0 )
{
	// Call exit middleware on all apps and plugins
	for ( const subAppName of SolidParcel.appNames )
		await SolidParcel.callMiddleware( 'exit', buildMode, SolidParcel.getAppConfig( subAppName ) );

	// Save Parcel's cache
	const killingLoader = printLoaderLine(`Saving asset graph to cache`)

	// Unsubscribe all running watchers
	for ( const appName of Object.keys(_unsubscribeHandler) )
		await _unsubscribeHandler[appName]();

	// Flush all disposables
	for ( const appName of Object.keys(_disposables) )
		await _disposables[appName].dispose();

	killingLoader(`Saved asset graph to cache`)

	// Exit cleanly
	await delay(.4)
	process.exit( code )
}

// Listen when user tries to kill process
let _listeningProcessKilled = false
let _killing = false
function listenProcessKilled ( buildMode:TBuildMode )
{
	// Listen only once ( can be called several times in SolidParcel.internalBuild )
	if ( _listeningProcessKilled ) return
	_listeningProcessKilled = true

	// Listen when program is asked to exits and do a clean exit
	onProcessKilled(async () => {
		if ( _killing ) return
		_killing = true
		await cleanExit( buildMode )
	});
}

// ----------------------------------------------------------------------------- UNHANDLED REJECTIONS

onProcessError(async (eventType:string, e) => {
	( eventType == 'unhandledRejection' )
	? nicePrint(`{b/r}Unhandled rejection`)
	: nicePrint(`{b/r}Uncaught error`)

	// Show clean diagnostic error if it exists
	if ( e && 'diagnostics' in e )
		for ( const diagnostic of (e as any)['diagnostics'] ) {
			const a = await require("@parcel/utils").prettyDiagnostic( diagnostic )
			process.stdout.write(a.message);
			process.stdout.write(a.stack);
			console.log('')
			process.stdout.write(a.codeframe);
			console.log('')
		}

	// Show classic error
	else {
		console.log(e)
		console.error(e)
	}

	// This is an internal error, no clean exit to avoid error handling loop !
	process.exit( 99 )
})

// ----------------------------------------------------------------------------- STRUCT

export type TBuildMode = "production"|"dev"

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
	 * Optional, application package root is where should be the package.json file and it's node_modules.
	 * If not defined, will use the higher directory hosting entries.
	 *
	 * Ex : entries: ['src/app/index.ts', 'src/app/sub-folder/sub-app.tsx']
	 *      packageRoot will be 'src/app/' and package.json should be here.
	 */
	packageRoot			?:string

	/**
	 * Optional, sources root (= entryRoot option in Parcel).
	 * Can be outside application directory, if you need to share some files between apps.
	 * Default is same as packageRoot.
	 */
	sourcesRoot			?:string

	/**
	 * Public URL is where assets are loaded from source of execution.
	 * For example, if app is starting in /my-app/ and assets are in sub-folder named /assets/
	 * publicURL can be /my-app/assets/ for absolute based targeting, or ./assets/ for relative targeting.
	 * Default is './', to load resources relatively to main file.
	 * Pass 'null' to use Parcel's default.
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
	 * Default is false.
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
	 * Parcel log level.
	 * Default is null to keep Parcel's default for web apps and "none" for node apps.
	 */
	parcelLogLevel		?:"none"|"error"|"warn"|"info"|"verbose"|null,

	/**
	 * HMR port for this app.
	 * Will use 3456 if not defined.
	 */
	hmrPort				?:number|null

	/**
	 * HMR host for this app. (no scheme prefix, no slashes)
	 * Will use hostname if not defined, so HMR should work across internal network.
	 */
	hmrHost				?:string|null
}

// Options after setup, we injected the name so plugins know which app it is
export interface IExtendedAppOptions extends IAppOptions {
	name		:string;
}

// ----------------------------------------------------------------------------- ENGINE CLASS

export class SolidParcel
{
	protected static _isFirstBuildingApp = true;

	// ------------------------------------------------------------------------- APP SETUP

	// List of all registered apps configurations
	protected static _apps : { [appName:string] : IExtendedAppOptions } = {};

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

		SolidParcel._apps[ appName ] = SolidParcel.extendAppOptions( appName, config );
	}

	/**
	 * Get all registered app names
	 */
	static get appNames () { return Object.keys(SolidParcel._apps); }

	/**
	 * Get a processed app config from name
	 * @param appName
	 */
	static getAppConfig ( appName:string ):IExtendedAppOptions {
		return appName in this._apps ? this._apps[ appName ] : null
	}

	// ------------------------------------------------------------------------- PUBLIC BUILD

	/**
	 * Start dev and watch mode.
	 * @param appName Application name to build in dev mode. Have to be declared with SolidParcel.app()
	 * @param envName Dot env file to load. If envName is empty or null, will load '.env'.
	 * 				  Ex : If envName is 'production', it will load '.env.production'.
	 * @param bypassPlugins Bypass plugins by name.
	 * 			            All plugins have a default name, and you can add a name property into plugin's config if
	 * 			            you have several of the same type.
	 */
	static async dev ( appName:string, envName?:string, bypassPlugins?:string[] ) {

		// Break default listeners limit to avoid warning in watch mode
		const globalEventEmitter = require('events').EventEmitter;
		if ( globalEventEmitter.defaultMaxListeners < 100 && globalEventEmitter.defaultMaxListeners != 0 )
			globalEventEmitter.defaultMaxListeners = 100;

		return await SolidParcel.internalBuild( appName, 'dev', envName, bypassPlugins );
	}

	/**
	 * Start build in production.
	 * @param appName Application name to build in production mode. Have to be declared with SolidParcel.app()
	 * @param envName Dot env file to load. If envName is empty or null, will load '.env'.
	 * 				  Ex : If envName is 'production', it will load '.env.production'.
	 * @param bypassPlugins Bypass plugins by name.
	 * 			            All plugins have a default name, and you can add a name property into plugin's config if
	 * 			            you have several of the same type.
	 */
	static async build ( appName:string, envName?:string, bypassPlugins?:string[] ) {
		return await SolidParcel.internalBuild( appName, 'production', envName, bypassPlugins );
	}

	// ------------------------------------------------------------------------- EXTEND APP OPTIONS

	protected static extendAppOptions ( appName:string, rawAppOptions:IAppOptions):IExtendedAppOptions
	{
		// Get default parameters
		const defaultOutput = `dist/public/static/${appName}/`;
		const appOptions:IExtendedAppOptions = {
			name: appName,
			input: `src/${appName}/*.{ts,tsx}`,
			output: defaultOutput,
			appType: "web",
			// publicUrl: path.dirname( rawAppOptions.output ?? defaultOutput ),
			publicUrl: rawAppOptions.publicUrl ?? './',
			hardWatch: false,
			parcelLogLevel: null,
			engines: {
				browsers: "> 5%",
				...rawAppOptions.engines
			},
			...rawAppOptions
		};

		// No parcel logs for node apps by default
		if ( appOptions.appType === 'node' )
			appOptions.parcelLogLevel = "none";

		// Default package root (@see IAppOptions documentation)
		if ( !appOptions.packageRoot ) {
			// Get project's root directory from inputs globs
			( Array.isArray( appOptions.input ) ? appOptions.input : [appOptions.input] ).map( input => {
				FileFinder.list( input ).map( filePath => {
					const fileRoot = path.dirname( filePath );
					// Take shorted project path root as project root
					if ( appOptions.packageRoot == null || fileRoot.length < appOptions.packageRoot.length )
						appOptions.packageRoot = fileRoot;
				});
			});
		}

		// Sources root is same as package root if not defined
		if ( !appOptions.sourcesRoot )
			appOptions.sourcesRoot = appOptions.packageRoot;

		return appOptions;
	}

	// ------------------------------------------------------------------------- INTERNAL BUILD

	protected static async internalBuild ( appName:string, buildMode:TBuildMode, dotEnvName?:string, bypassPlugins?:string[] )
	{
		// Check if this app exists
		if ( !SolidParcel._apps[ appName ] )
			nicePrint(`
				{b/r}App ${appName} does not exists.
				{l}Please use {w/i}Solid.app( ... )
			`, { code: 1 });

		// Listen if program crashes, or if dev hit ctrl+c on keyboard to stop process
		listenProcessKilled( buildMode );

		// Install and copy node modules of all apps before we build.
		// We do this now to avoid triggering the watch if we have multiple apps !
		if ( SolidParcel._isFirstBuildingApp ) {
			for ( const subAppName of SolidParcel.appNames ) {
				const subAppOptions = SolidParcel._apps[ subAppName ];
				if ( subAppOptions.appType === 'node' ) {
					setLoaderScope( subAppName );
					await SolidParcel.copyNodePackagesToDestination( subAppOptions );
				}
				await SolidParcel.callMiddleware('prepare', buildMode, subAppOptions, null, null, bypassPlugins);
			}
		}

		// Target current solid app for logs
		setLoaderScope( SolidParcel.appNames.length > 1 ? appName : null );

		// Dot env file to load
		const dotEnvPath = '.env' + (dotEnvName ? '.'+dotEnvName : '');
		const dotEnvLoader = printLoaderLine(`Loading ${dotEnvPath}`);

		// Load dot env
		const dotEnvFile = new File( dotEnvPath ).load();
		const envProps = ( dotEnvFile.exists() ? dotEnvFile.dotEnv() : {} ) as any;

		// This specific dot env does not exists
		// Do not crash if .env does not exists
		if ( !dotEnvFile.exists() ) {
			if ( dotEnvName ) {
				dotEnvLoader(`Env file ${dotEnvPath} not found`, 'error');
				process.exit(2);
			}
			// .env not found, just raise a warning
			else dotEnvLoader(`Env file not found`, 'warning');
		}
		// Env file found and loaded
		else dotEnvLoader(`Loaded ${dotEnvPath}`);

		// Target extended app options
		const appOptions = SolidParcel._apps[ appName ];

		// Inject package.json version into envs
		let packageFile = new File( path.join(appOptions.packageRoot, 'package.json') );
		if ( !packageFile.exists() ) {
			packageFile = new File( 'package.json' );
		}
		if ( packageFile.exists() ) {
			await packageFile.loadAsync()
			envProps.VERSION = (packageFile.json() as any).version
		}

		// Inject NODE_ENV
		envProps.NODE_ENV = buildMode == 'dev' ? 'development' : 'production'

		// Inject envs from passEnvs option
		appOptions.passEnvs && appOptions.passEnvs.map( key => {
			if ( key in process.env )
				envProps[ key ] = process.env[ key ]
		});

		// FIXME : For now, parcel follow logLevel only on prod ?
		// FIXME : Or maybe because we have 2 apps ...
		if ( buildMode === 'dev' ) //&& appOptions.appType === 'web' )
			delete appOptions.parcelLogLevel;

		// This is a bugfix for parcel logger,
		// We need to add a line if we are after first app
		if ( !SolidParcel._isFirstBuildingApp && appOptions.parcelLogLevel !== 'none' ) {
			newLine();
		}
		SolidParcel._isFirstBuildingApp = false;

		// Start parcel build
		await SolidParcel.bundleParcel( buildMode, appOptions, envProps, bypassPlugins );
	}

	// ------------------------------------------------------------------------- NODE SPECIFIC

	protected static async copyNodePackagesToDestination ( appOptions:IExtendedAppOptions )
	{
		// Target package.json and continue only if it exists
		const packageFile = new File( path.join(appOptions.packageRoot, 'package.json') );
		if ( !packageFile.exists() ) return;

		// Target destination node_module and do not continue if it exists
		const destinationNodeModulesDirectory = new Directory( path.join(appOptions.output, 'node_modules') )
		if ( destinationNodeModulesDirectory.exists() ) return;

		// Copy package.json
		const copyLoader = printLoaderLine(`Copying modules to output ...`);

		// Ensure destination parents to avoid node_modules to be exploded into dist
		await new Directory( appOptions.output ).ensureParentsAsync()
		await packageFile.copyToAsync( appOptions.output );

		// Check if we need to install dependencies and install them
		const nodeModulesDirectory = new Directory( path.join(appOptions.packageRoot, 'node_modules') );
		if ( !nodeModulesDirectory.exists() ) {
			const installingLoader = printLoaderLine(`Installing dependencies ...`);
			try {
				await execAsync('npm i', 0, { cwd: appOptions.packageRoot });
				installingLoader('Installed dependencies');
			}
			catch (e) {
				installingLoader('Unable to install dependencies', 'error');
				console.error(e);
				process.exit(4);
			}

			// Copy to destination folder
			await nodeModulesDirectory.copyToAsync( appOptions.output );
		}
		// No need to install dependencies
		else
		{
			// Move from cache if available
			const appCacheDirectory = new Directory( targetSolidParcelCacheObject(appOptions.name, 'node_modules') );
			appCacheDirectory.exists()
			? await appCacheDirectory.moveToAsync( appOptions.output )
			// Copy from src
			: await nodeModulesDirectory.copyToAsync( appOptions.output );
		}

		copyLoader(`Copied modules to output`);
	}

	// ------------------------------------------------------------------------- BUILD PARCEL

	protected static bundleParcel = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions, envProps?:object, bypassPlugins?:string[], bundler?:any  ) => new Promise<void>( async resolve =>
	{
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

		// Enable HMR options with defaults if web app in dev mode
		let hmrOptions = null;
		if ( appOptions.appType === 'web' && buildMode === 'dev' )
			hmrOptions = {
				port: appOptions.hmrPort ?? 3456,
				host: appOptions.hmrHost ?? require("os").hostname()
			};

		// Init parcel config
		await delay(.05);

		if ( !bundler ) {
			const fs = new NodeFS();
			const packageManager = new NodePackageManager( fs );
			bundler = new Parcel({
				entries: appOptions.input,
				entryRoot: appOptions.sourcesRoot,

				packageManager,

				// TODO : Add option ? If we forget something it will crash or behave wrongly
				defaultConfig: '.parcelrc',
				// defaultConfig: require.resolve("@parcel/config-default"),

				targets: {
					// https://v2.parceljs.org/plugin-system/api/#PackageTargetDescriptor
					app: {
						// Optimization and dev options
						optimize: isProd && isWeb,
						sourceMap: !isProd,
						// scopeHoist: true,

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

				// defaultTargetOptions: {
				// 	shouldOptimize: isProd && isWeb,
				// 	sourceMaps: !isProd,
				// 	shouldScopeHoist: false,
				// 	publicUrl: appOptions.publicUrl,
				// 	distDir: appOptions.output,
				// },

				env: envProps,
				hmrOptions,

				shouldDisableCache: false, // TODO : Add option ?
				shouldAutoInstall: false, // TODO : Add option

				// cacheDir: parcelCacheDirectoryName,
				// serveOptions: false, // TODO : Add option
				// shouldContentHash: false,//isProd, // TODO : Add option
				// shouldProfile: false, // TODO : Add option
				// shouldBuildLazily: false,
				// detailedReport: false, // TODO ??

				// --log-level (none/error/warn/info/verbose)
				logLevel: appOptions.parcelLogLevel,
				shouldPatchConsole: false,

				mode: isProd ? 'production' : 'development',

				additionalReporters: [
					{ packageName: '@parcel/reporter-cli', resolveFrom: __filename },
					{ packageName: '@parcel/reporter-dev-server', resolveFrom: __filename }
				]
			});

			// Connect disposable to parcel events
			_disposables[ appOptions.name ] = new ( parcelEvents.Disposable )();
		}

		// Before build middleware
		await SolidParcel.callMiddleware( "beforeBuild", buildMode, appOptions, envProps, null, null, bypassPlugins );

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
			await SolidParcel.callMiddleware( "afterBuild", buildMode, appOptions, envProps, buildEvent, buildError, bypassPlugins );

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
				// Register unsubscribe function for this app to be able to stop gracefully
				_unsubscribeHandler[ appOptions.name ] = watcher.unsubscribe

				if ( count == 0 )
					stopBuildProgress()

				count ++

				// FIXME : Sure about that ? Maybe an option ? watchMode = 'classic'|'complete'|'hard'
				// In regular watch mode, do before middleware now
				if ( !appOptions.hardWatch && count > 1 )
					await SolidParcel.callMiddleware( "beforeBuild", buildMode, appOptions, envProps, buildEvent, buildError, bypassPlugins );

				// After middleware, only at first build in hardWatch mode because we will restart bundler
				if ( (appOptions.hardWatch && count == 1) || !appOptions.hardWatch )
					await SolidParcel.callMiddleware( "afterBuild", buildMode, appOptions, envProps, buildEvent, buildError, bypassPlugins );

				// First build, this is not a file change trigger
				if ( count == 1 )
					resolve();

				// Option hard watch will restart parcel bundler after each file change
				// This allow to have before and after middleware correctly called
				if ( appOptions.hardWatch && count == 2) {
					await watcher.unsubscribe();
					delete _unsubscribeHandler[ appOptions.name ]
					SolidParcel.bundleParcel( buildMode, appOptions, envProps, bypassPlugins, /*bundler*/ );
				}
			});
		}
	})

	// ------------------------------------------------------------------------- MIDDLEWARES & PLUGINS

	static async callMiddleware ( middlewareName:TMiddlewareType, buildModeOrCommand:TBuildMode|ICommand, appOptions:IExtendedAppOptions, envProps?:object, buildEvent?, buildError?, bypassPlugins = [] )
	{
		// Target current solid app building for logs
		if ( SolidParcel.appNames.length > 1 )
			setLoaderScope( appOptions.name );

		// If there are no plugins, do not continue
		if ( !appOptions.plugins ) return;

		// Call each middleware sequentially
		let currentPlugin
		try {
			for ( currentPlugin of appOptions.plugins ) {
				if ( bypassPlugins.indexOf(currentPlugin.name) !== -1 ) continue;
				if ( !(middlewareName in currentPlugin ) ) continue;
				await currentPlugin[ middlewareName ]( buildModeOrCommand, appOptions, envProps, buildEvent, buildError );
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

	// ------------------------------------------------------------------------- CLEAR CACHE

	/**
	 * Clear parcel and solid caches.
	 * Will browse every app package roots and delete .parcel-cache and .solid-cache directories.
	 * No command called, plugins must use parcel cache.
	 * @param appName null to clear all caches, or an app name to clear a specific cache.
	 */
	static async clearCache ( appName?:string )
	{
		const clearLoader = printLoaderLine(`Clearing cache ...`);
		setLoaderScope( null );
		let clearedPaths = [];

		// Clear root solid cache
		let dir = new Directory( solidCacheDirectoryName )
		if ( dir.exists() ) {
			clearedPaths.push( dir.path );
			dir.remove();
		}

		// Clear root parcel cache
		dir = new Directory( parcelCacheDirectoryName )
		if ( dir.exists() ) {
			clearedPaths.push( dir.path );
			dir.remove();
		}

		// Clear caches of all apps or selected app
		SolidParcel.appNames.map( subAppName => {
			if ( !appName || subAppName === appName ) {
				//setLoaderScope( SolidParcel.appNames.length > 1 ? subAppName : null );
				const { packageRoot } = SolidParcel._apps[ subAppName ]
				if ( !packageRoot ) return;
				const dirPath = path.join( packageRoot, parcelCacheDirectoryName );
				dir = new Directory( dirPath );
				if ( !dir.exists() ) return;
				clearedPaths.push( dir.path );
				dir.remove();
			}
		});

		clearLoader(`${clearedPaths.length} cache${clearedPaths.length > 1 ? 's' : ''} cleared`, '🧹');
		return clearedPaths;
	}

	// ------------------------------------------------------------------------- CLEAN

	/**
	 * Remove every generated files, on a specific app or on all apps.
	 * Will delete all output directories and call "clean" action.
	 * @param appName null to clean all app outputs, or an app name to clean a specific app output.
	 * @param keepNodeModules Will move node_modules to parcel cache directory, to allow faster next build.
	 * @param commandParameters Parameters given to clean action in plugin middlewares
	 * @param bypassPlugins Bypass plugins by name.
	 * 			              All plugins have a default name, and you can add a name property into plugin's config if
	 * 			              you have several of the same type.
	 */
	static async clean ( appName ?:string, keepNodeModules = false, commandParameters = {}, bypassPlugins?:string[] )
	{
		const cleanLoader = printLoaderLine(`Cleaning outputs ...`);
		setLoaderScope( null );
		let clearedPaths = [];

		for ( const subAppName of SolidParcel.appNames ) {
			if ( !appName || subAppName === appName ) {
				// Target app
				//setLoaderScope( SolidParcel.appNames.length > 1 ? subAppName : null );
				const subAppOptions = SolidParcel._apps[ subAppName ];

				// Move output node_modules to solid cache to avoid copying it at every build
				if ( keepNodeModules ) {
					const dir = new Directory( path.join(subAppOptions.output, 'node_modules') );
					if ( dir.exists() ) {
						const appCacheDirectory = new Directory( targetSolidParcelCacheObject(subAppName) );
						await appCacheDirectory.ensureParentsAsync();
						await dir.moveToAsync( appCacheDirectory.path );
					}
				}

				// Target app output and empty it if it exists
				const dir = new Directory( SolidParcel._apps[ subAppName ].output );
				if ( dir.exists() ) {
					clearedPaths.push( dir.path );
					dir.clean();
				}

				// Call clean action
				const command = { command: 'clean', parameters: commandParameters }
				await SolidParcel.callMiddleware( 'action', command, subAppOptions, null, null, null, bypassPlugins );
			}
		}

		cleanLoader(`Cleaned ${clearedPaths.length} director${clearedPaths.length > 1 ? 'ies' : 'y'}`, '🧹')
		return clearedPaths;
	}

	// ------------------------------------------------------------------------- ACTIONS

	/**
	 * Call a plugin action on a specific app or on all apps.
	 * @param commandName Command name of action. See command available in used plugins.
	 * @param commandParameters Parameters given to this command.
	 * @param appName null to call all app plugins, or an app name to cal a specific app plugins.
	 * @param bypassPlugins Bypass plugins by name.
	 * 			            All plugins have a default name, and you can add a name property into plugin's config if
	 * 			            you have several of the same type.
	 */
	static async action ( commandName:string, commandParameters:object, appName:string, bypassPlugins?:string[] )
	{
		for ( const subAppName of SolidParcel.appNames ) {
			if ( !appName || subAppName === appName ) {
				const subAppOptions = SolidParcel._apps[ subAppName ];
				const command = { command: commandName, parameters: commandParameters }
				await SolidParcel.callMiddleware( 'action', command, subAppOptions, null, null, null, bypassPlugins );
			}
		}
	}

	// ------------------------------------------------------------------------- EXIT

	/**
	 * Clean exit program.
	 * @param code 0 for a success, 1 or + for an error
	 */
	static async exit ( code:number ) {
		await cleanExit( null, code ) // FIXME : Find build mode here, scope or keep var on top level
	}
}
