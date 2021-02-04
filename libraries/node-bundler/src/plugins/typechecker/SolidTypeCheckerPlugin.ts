import { SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, ISolidMiddleware, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from "child_process";
import { printLoaderLine } from "@solid-js/cli";
import { delay } from "@solid-js/core";

// -----------------------------------------------------------------------------

interface ISolidTypeCheckerPluginConfig extends Partial<ISolidMiddleware> {

	sounds 		?: "full"|"always"|"errors"|"none"|boolean

	frequency 	?: number

	// TODO : Check laptop on battery and disable type check
	// frequency : 'auto'
}

const _defaultConfig:Partial<ISolidTypeCheckerPluginConfig> = {
	sounds 		: true,
	frequency 	: 1
}

// -----------------------------------------------------------------------------

export class SolidTypeCheckerPlugin extends SolidPlugin <ISolidTypeCheckerPluginConfig>
{
	static init ( config:ISolidTypeCheckerPluginConfig ) {
		return new SolidTypeCheckerPlugin('middleware', { ..._defaultConfig, ...config })
	}

	protected _buildIndex 			= 0;

	protected _currentChecker		:ChildProcess;
	protected _checkingLoader		:any;

	protected typeCheck = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions ) => new Promise<void>( (resolve, reject) => {

		// Kill already running type checker
		if ( this._currentChecker ) {
			this._currentChecker.kill();
			this._checkingLoader && this._checkingLoader();
		}

		// TODO : Frequency

		// Start typechecking command with tsc
		this._checkingLoader = printLoaderLine('Checking typescript ...');
		const command = `./node_modules/typescript/bin/tsc --noEmit --pretty`;
		this._currentChecker = exec( command ); // TODO : Target entry points

		// Type check is finished
		this._currentChecker.once('exit', ( code ) => {
			// Remove typechecker instance
			this._currentChecker.kill();
			this._currentChecker = null;

			// Success
			if ( code === 0 ) {
				// TODO : Sound
				this._checkingLoader('Typescript validated', '👌')
				resolve();
			}

			// Fail
			else {
				// TODO : Sound
				this._checkingLoader('Typescript error', 'error');
				buildMode == 'production' ? reject() : resolve();
			}

			// Remove loader instance
			this._checkingLoader = null;
		})
	});

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		if ( buildMode === 'production' )
			await this.typeCheck( buildMode, appOptions );
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		if ( buildMode === 'dev')
			await this.typeCheck( buildMode, appOptions );
	}
}