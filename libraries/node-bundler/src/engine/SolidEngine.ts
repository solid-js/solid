import { SolidPlugin } from "./SolidPlugin";
import Parcel from "@parcel/core";

// -----------------------------------------------------------------------------

export type TBundleType = 'parcel'|'tsc'

export type TBuildMode = "production"|"dev"

export type TMiddlewareType = "before"|"after";

export type TEnvFilter = ( envs:object, buildMode:TBuildMode ) => object;

export interface IAppOptions
{
	bundler 	?:TBundleType,

	input		?:string
	output		?:string
	root		?:string
	publicUrl 	?:string
	envsFilter	?:TEnvFilter

	actions 	?:{ [key:string] : IAction }

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

// -----------------------------------------------------------------------------

export class SolidEngine
{
	// ------------------------------------------------------------------------- SETUP

	static _apps : { [appName:string] : IAppOptions } = {};

	static app ( appName:string, config:IAppOptions ) {
		this._apps[ appName ] = config;
	}

	// ------------------------------------------------------------------------- BUILD

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
			output: `public/${appName}`,
			root: 'src/',
			publicUrl: null,

			...this._apps[ appName ]
		};

		// TODO -> Clean output folder

		// TODO -> Read .env props with envName
		let envProps = {};

		// Filter env properties
		if ( options.envsFilter )
			envProps = options.envsFilter( envProps, type )

		// Build with parcel
		if ( options.bundler === 'parcel' )
			await this.bundleParcel( options, type, envProps );

		// Build with typescript
		else if ( options.bundler === 'tsc' )
			await this.bundleTypescript( options, type, envProps );
	}

	// ------------------------------------------------------------------------- PARCEL

	protected static async bundleParcel ( options:IAppOptions, type:TBuildMode, envProps?:object )
	{
		const isProd = type === 'production';

		const bundler = new Parcel({
			entries: options.input,
			entryRoot: options.root,
			publicUrl: options.publicUrl,

			targets: {
				app: {
					context: 'browser',
					distDir: options.output,
					outputFormat: 'global',
					// TODO
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


		await this.callMiddleware( "before", options, type, envProps );

		if ( isProd )
		{
			await bundler.run();

			await this.callMiddleware( "after", options, type, envProps );
		}
		else
		{
			const watcher = await bundler.watch( async (error, buildEvent) => {

				// FIXME : Async works ?
				//console.log(a, b); // ?

				console.log(error, buildEvent)

				await this.callMiddleware( "after", options, type, envProps );
			});


			// TODO : Start plugins watch
			// TODO : If a plugin watch has an event, stop watcher
			// await watcher.unsubscribe()
			// TODO : Then restart
		}

		console.log('DONE');
	}

	// ------------------------------------------------------------------------- TYPESCRIPT

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
			console.log('PLUGIN', plugin.name) // TODO : Clean log task with success and failure
			await plugin[ middlewareName ]( options, type, envProps );
		}
	}
}
