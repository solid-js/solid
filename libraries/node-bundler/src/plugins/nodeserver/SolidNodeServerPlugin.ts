import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from 'child_process'
import { delay } from '@solid-js/core'
import { generateLoaderLineTemplate, onProcessKilled, printLine, printLoaderLine } from '@solid-js/cli'

// -----------------------------------------------------------------------------

type TStdStreamType = 'pipe'|'nice'|'none'|false

interface ISolidNodeServerPluginConfig extends IBaseSolidPluginConfig
{
	/**
	 * Default is `node $appName.js`
 	 */
	startCommand 	?: string

	/**
	 * Default is app option output directory
 	 */
	cwd			 	?: string

	/**
	 * Safe delay after server shutdown, default is 100ms
 	 */
	delay			?: number

	/**
	 * Safe delay after server crash restart, default is 2s
	 */
	restartDelay	?: number


	stdout			?: TStdStreamType
	stderr			?: TStdStreamType
}

const _defaultConfig:Partial<ISolidNodeServerPluginConfig> = {
	delay	: .1,
	restartDelay : 2,
	stdout	: 'nice',
	stderr	: 'nice',
}

// -----------------------------------------------------------------------------

export class SolidNodeServerPlugin extends SolidPlugin <ISolidNodeServerPluginConfig>
{
	// ------------------------------------------------------------------------- INIT

	static init ( config:ISolidNodeServerPluginConfig) {
		return new SolidNodeServerPlugin({ name:'node server', ..._defaultConfig, ...config })
	}

	init () {
		// Kill running process when exiting parent
		onProcessKilled( async () => {
			await this.killRunningServer();
			process.exit();
		});
	}

	// ------------------------------------------------------------------------- PROPERTIES

	protected _runningServer			:ChildProcess;

	protected _restartServerIfCrashed 	= false;

	protected _showLogs 				= true;

	// ------------------------------------------------------------------------- START & KILL SERVER

	protected async killRunningServer ( force = false ) {
		// Do not kill twice 🔪
		if ( !this._runningServer ) return;

		const killingServer = this._showLogs && printLoaderLine(`Killing ${this._config.name} ...`);

		// Do not restart server when crashed, otherwise we have a loop
		this._restartServerIfCrashed = false;

		// Cleanly remove every listeners
		this._runningServer.stdout.destroy();
		this._runningServer.stderr.destroy();
		this._runningServer.removeAllListeners();

		// Kill or force kill, remove reference to know it's killed
		this._runningServer.kill( force ? "SIGKILL" : "SIGTERM" );
		this._runningServer = null;

		// Safe wait
		await delay( this._config.delay );
		this._showLogs && killingServer(`${this._config.name} killed`, '💀')
	}

	protected async startServer ( appOptions?:IExtendedAppOptions, envProps?:object ) {
		// Start server
		const startingServerLoader = this._showLogs && printLoaderLine(`Starting ${this._config.name} ...`);
		this._runningServer = exec( this._config.startCommand, {
			cwd: this._config.cwd ?? appOptions.output,
			env: envProps as any
		})
		await delay( this._config.delay );
		this._showLogs && startingServerLoader(`${this._config.name} started`, '🥳');

		// Nice stream piping
		if ( this.config.stdout === 'nice' )
			this._runningServer.stdout.on('data', data => printLine( generateLoaderLineTemplate(data, '🔎') ));
		if ( this.config.stderr === 'nice' )
			this._runningServer.stderr.on('data', data => printLine( generateLoaderLineTemplate(data, '🔥') ));

		// Classic stream piping
		this.config.stdout === 'pipe' && this._runningServer.stdout.pipe( process.stdout );
		this.config.stderr === 'pipe' && this._runningServer.stderr.pipe( process.stderr );

		// We can now restart server if it crashes
		this._restartServerIfCrashed = true;
		this._runningServer.once('exit', async () => {
			// Do not continue if we are closing it on purpose
			if (!this._restartServerIfCrashed) return;

			// We are in recovery mode, no logs please
			this._showLogs = false;

			// Kill server cleanly and wait
			await this.killRunningServer();

			// Restart server with afterBuild hook
			const restartServer = printLoaderLine(`${this._config.name} has crashed, restarting ...`);
			await delay( this._config.restartDelay );
			await this.startServer( appOptions, envProps );
			restartServer(`${this._config.name} restarted`, '🥳');

			// We can show logs
			this._showLogs = true;
		})
	}

	// ------------------------------------------------------------------------- BUILD LIFECYCLE

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		if ( buildMode === 'dev' )
			await this.killRunningServer();
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		// Default start command from appOptions
		if ( !this._config.startCommand )
			this._config.startCommand = `node ${appOptions.name}.js`;

		// Continue only in dev mode
		if ( buildMode === 'dev' )
			await this.startServer( appOptions, envProps );
	}
}