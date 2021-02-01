import { SolidPlugin } from "./SolidPlugin";
import Parcel from "@parcel/core";

// ----------------------------------------------------------------------------- STRUCT

export type TBundler = 'parcel'|'tsc'

export type TBuildMode = "production"|"dev"

export type TMiddlewareType = "before"|"after";

export interface IAppOptions
{
	/**
	 * Bundle with
	 * - Parcel, optimized for the web
	 * - TSC (Typescript compiler), optimized for Node based applications
	 */
	bundler 	?:TBundler,

	/**
	 * List of starting points paths, can be list, can be globs :
	 * Default is `src/${appName}/*.{ts,tsx}`
	 *
	 * ex : 'src/app/index.tsx'
	 * ex : 'src/app/*.tsx'
	 * ex : ['src/app/index.tsx', 'src/app/index.ts']
	 * ex : ['src/app/*.tsx', 'src/app/*.ts']
	 */
	input		?:string|string[]

	/**
	 * Output directory.
	 * Default is `public/static/${appName}/`
	 */
	output		?:string

	/**
	 * Optional, sources root.
	 * Default is 'src/'
	 */
	root		?:string

	/**
	 * TODO
	 */
	publicUrl 	?:string

	/**
	 * Pass envs variables from current env to bundle env.
	 * Those envs variables will override .env variables.
	 * Ex : ['API_GATEWAY', 'BASE'] will allow env variables injections when
	 * running : API_GATEWAY='/api/' BASE='/base/' npm run production
	 */
	passEnvs	?:string[]

	/**
	 * TODO TO DEFINE
	 */
	actions 	?:{ [key:string] : IAction }

	/**
	 * TODO
	 */
	plugins		?:SolidPlugin[]
}

interface IAction
{
	// TODO ...
}

export interface ISolidMiddleware
{
	beforeBuild ( appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object ) : Promise<any>|void|null

	afterBuild ( appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object ) : Promise<any>|void|null
}

// ----------------------------------------------------------------------------- ENGINE CLASS

export class SolidEngine
{
	// ------------------------------------------------------------------------- SETUP

	static _apps : { [appName:string] : IAppOptions } = {};

	/**
	 * TODO
	 * @param appName
	 * @param config
	 */
	static app ( appName:string, config:IAppOptions ) {
		this._apps[ appName ] = config;
	}

	// ------------------------------------------------------------------------- BUILD

	/**
	 * TODO
	 * @param appName
	 * @param type
	 * @param envName
	 */
	static async build ( appName:string, type:TBuildMode, envName?:string )
	{
		if ( !this._apps[ appName ] )
		{
			// TODO : Halt error
			return;
		}

		const options:IAppOptions = {
			bundler: 'parcel',

			input: `src/${appName}/*.{ts,tsx}`,
			output: `public/static/${appName}/`,
			root: 'src/',
			publicUrl: null,

			...this._apps[ appName ]
		};

		// TODO -> Clean output folder

		// TODO -> Read .env props with envName
		// TODO -> Pass envs from envs array
		let envProps = {};

		// Build with parcel
		if ( options.bundler === 'parcel' )
			await this.bundleParcel( options, type, envProps );

		// Build with typescript
		else if ( options.bundler === 'tsc' )
			await this.bundleTypescript( options, type, envProps );
	}

	// ------------------------------------------------------------------------- BUILD PARCEL

	protected static async bundleParcel ( options:IAppOptions, type:TBuildMode, envProps?:object )
	{
		const isProd = type === 'production';

		await this.callMiddleware( "before", options, type, envProps );

		const bundler = new Parcel({
			entries: options.input,
			entryRoot: options.root,
			publicUrl: options.publicUrl,

			targets: {
				app: {
					context: 'browser',
					distDir: options.output,
					outputFormat: 'global',
					// TODO : Add to config or read package.json ?
					//engines: {
					//	browsers: "> 5%"
					//}
				},
				// TODO ?
			},

			//killWorkers: true, // ?

			env: envProps,
			hot: !isProd,

			patchConsole: false,
			disableCache: false,

			mode: isProd ? 'production' : 'development',
			minify: isProd,
			sourceMaps: !isProd
		})

		if ( isProd )
		{
			await bundler.run();

			await this.callMiddleware( "after", options, type, envProps );
		}
		else
		{
			try {
				const watcher = await bundler.watch( async (error, buildEvent) => {

					// FIXME : Async works ?
					//console.log(a, b); // ?

					console.log(error, buildEvent)

					await this.callMiddleware( "after", options, type, envProps );
				});
			}
			catch (e) {
				console.error('ERR', e);
			}


			// TODO : Start plugins watch
			// TODO : If a plugin watch has an event, stop watcher
			// await watcher.unsubscribe()
			// TODO : Then restart
		}

		console.log('DONE');
	}

	// ------------------------------------------------------------------------- BUILD TYPESCRIPT

	protected static async bundleTypescript ( options:IAppOptions, type:TBuildMode, envProps?:object )
	{
		// TODO ...
	}

	// ------------------------------------------------------------------------- MIDDLEWARES & PLUGINS

	protected static async callMiddleware ( event:TMiddlewareType, options:IAppOptions, type:TBuildMode, envProps:object  )
	{
		if ( !options.plugins ) return;

		const middlewareName = event+'Build';

		for ( const plugin of options.plugins ) {
			//console.log('PLUGIN', plugin.name) // TODO : Clean log task with success and failure
			await plugin[ middlewareName ]( options, type, envProps );
		}
	}
}
