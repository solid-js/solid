import { SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, ISolidMiddleware, printSolidLine, TBuildMode } from "../../engine/Solid";
import { ChildProcess, exec } from 'child_process'
import { delay } from '@solid-js/core'

// -----------------------------------------------------------------------------

interface ISolidNodeServerPluginConfig extends Partial<ISolidMiddleware>
{
	// Default is `node $appName.js`
	startCommand 	?: string

	// Default is app option output directory
	cwd			 	?: string

	delay			?: number

	// TODO : Envs ! Function with envProps of app in entry ?
}

const _defaultConfig:Partial<ISolidNodeServerPluginConfig> = {
	delay: .2
}

// -----------------------------------------------------------------------------

export class SolidNodeServerPlugin extends SolidPlugin <ISolidNodeServerPluginConfig>
{
	static init ( config:ISolidNodeServerPluginConfig ) {
		return new SolidNodeServerPlugin('nodeserver', { ..._defaultConfig, ...config })
	}

	protected _runningServer:ChildProcess;

	init () { }

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		//this._config.beforeBuild( buildMode, appOptions, envProps );
		if ( buildMode === 'dev' && this._runningServer ) {

			// newLine();
			const killingServer = printSolidLine('🔪', 'Killing node server ...');
			this._runningServer.stdout.destroy();
			this._runningServer.stderr.destroy();
			this._runningServer.kill("SIGKILL");
			this._runningServer = null;

			await delay( this._config.delay );
			killingServer('💀', 'Server killed')
		}
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {

		if ( !this._config.startCommand )
			this._config.startCommand = `node ${appOptions.name}.js`;

		if ( buildMode === 'dev' && this._config.startCommand ) {
			/*console.log({
				command: this._config.startCommand,
				cwd: this._config.cwd ?? appOptions.output
			});*/

			// newLine();
			const startingServer = printSolidLine('⚙️ ', 'Starting server ...');
			this._runningServer = exec( this._config.startCommand, {
				cwd: this._config.cwd ?? appOptions.output,
				env: envProps as any
			})

			//await delay( this._config.delay );
			startingServer('🥳', 'Server started');

			this._runningServer.stdout.on('data', (data) => {
				printSolidLine('🔎', data);
			})
			this._runningServer.stderr.on('data', (data) => {
				printSolidLine('🔥', data);
			})

			// TODO : Config pipe
			// @ts-ignore
			//this._runningServer.stdout.pipe( process.stdout );
			// @ts-ignore
			//this._runningServer.stderr.pipe( process.stderr );

		}
	}
}