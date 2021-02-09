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
		return new SolidNodeServerPlugin({ name:'node server', ..._defaultConfig, ...config })
	}

	protected _runningServer:ChildProcess;

	init ()
	{
		// Kill running process when exiting parent
		onProcessKilled( () => this.killRunningServer() );
	}

	protected _restartServerIfCrashed = false;

	protected _isRecovering = true;

	protected async killRunningServer ( force = false )
	{
		if ( !this._runningServer ) return;
		const killingServer = this._isRecovering && printLoaderLine(`Killing ${this._config.name} ...`);

		this._restartServerIfCrashed = false;
		this._runningServer.stdout.destroy();
		this._runningServer.stderr.destroy();
		this._runningServer.removeAllListeners();
		this._runningServer.kill( force ? "SIGKILL" : "SIGTERM" );
		this._runningServer = null;

		await delay( this._config.delay );
		this._isRecovering && killingServer(`${this._config.name} killed`, '💀')
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

			const startingServerLoader = this._isRecovering && printLoaderLine(`Starting ${this._config.name} ...`);
			this._runningServer = exec( this._config.startCommand, {
				cwd: this._config.cwd ?? appOptions.output,
				env: envProps as any
			})
			await delay( this._config.delay );
			this._isRecovering && startingServerLoader(`${this._config.name} started`, '🥳');

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

			this._restartServerIfCrashed = true;

			this._runningServer.once('exit', async () => {
				if (!this._restartServerIfCrashed) return;

				this._isRecovering = false;
				await this.killRunningServer();

				const restartServer = printLoaderLine(`${this._config.name} has crashed, restarting ...`);
				await delay(2);
				await this.afterBuild( buildMode, appOptions, envProps );
				restartServer(`${this._config.name} restarted`, '🥳');
				this._isRecovering = true;
			})
		}
	}
}