import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from 'child_process'
import { delay } from '@solid-js/core'
import { generateLoaderLineTemplate, onProcessKilled, printLine, printLoaderLine } from '@solid-js/cli'

// -----------------------------------------------------------------------------

type TStdStreamType = 'pipe'|'nice'|'none'|false

interface ISolidNodeServerPluginConfig extends IBaseSolidPluginConfig
{
	// Default is `node $appName.js`
	startCommand 	?: string

	// Default is app option output directory
	cwd			 	?: string

	// Safe delay after server shutdown
	delay			?: number

	stdout			?: TStdStreamType
	stderr			?: TStdStreamType
}

const _defaultConfig:Partial<ISolidNodeServerPluginConfig> = {
	delay	: .1,
	stdout	: 'nice',
	stderr	: 'nice',
}

// -----------------------------------------------------------------------------

export class SolidNodeServerPlugin extends SolidPlugin <ISolidNodeServerPluginConfig>
{
	static init ( config:ISolidNodeServerPluginConfig) {
		return new SolidNodeServerPlugin({ name:'nodeserver', ..._defaultConfig, ...config })
	}

	protected _runningServer:ChildProcess;

	init ()
	{
		// Kill running process when exiting parent
		onProcessKilled( () => this.killRunningServer() );
	}

	protected async killRunningServer ()
	{
		if ( !this._runningServer ) return;
		const killingServer = printLoaderLine('Killing node server ...', '🔪');

		this._runningServer.stdout.destroy();
		this._runningServer.stderr.destroy();
		this._runningServer.kill("SIGKILL");
		this._runningServer = null;

		await delay( this._config.delay );
		killingServer('Server killed', '💀')
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		if ( buildMode === 'dev' && this._runningServer )
			await this.killRunningServer();
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {

		if ( !this._config.startCommand )
			this._config.startCommand = `node ${appOptions.name}.js`;

		if ( buildMode === 'dev' && this._config.startCommand ) {
			/*console.log({
				command: this._config.startCommand,
				cwd: this._config.cwd ?? appOptions.output
			});*/
			const startingServerLoader = printLoaderLine('Starting server ...');

			// FIXME : Check errors : .on('exit') ? or try catch ?

			this._runningServer = exec( this._config.startCommand, {
				cwd: this._config.cwd ?? appOptions.output,
				env: envProps as any
			})
			await delay( this._config.delay );
			startingServerLoader('Server started', '🥳');

			// Nice stream piping
			if ( this.config.stdout === 'nice' )
				this._runningServer.stdout.on('data', data => printLine( generateLoaderLineTemplate(data, '🔎') ));
			if ( this.config.stderr === 'nice' )
				this._runningServer.stderr.on('data', data => printLine( generateLoaderLineTemplate(data, '🔥') ));

			// Classic stream piping
			// @ts-ignore
			this.config.stdout === 'pipe' && this._runningServer.stdout.pipe( process.stdout );
			// @ts-ignore
			this.config.stderr === 'pipe' && this._runningServer.stderr.pipe( process.stderr );
		}
	}
}