import { IBaseSolidPluginConfig, SolidPlugin, SolidPluginException } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from "child_process";
import { newLine, nicePrint, printLoaderLine } from "@solid-js/cli";
import { untab } from "@solid-js/core";
import { File } from "@solid-js/files";
import path from "path";
import { getBatteryLevel } from "../../engine/SolidUtils";

// -----------------------------------------------------------------------------

interface ISolidTypeCheckerPluginConfig extends IBaseSolidPluginConfig {

	sounds 				?: "all"|"errors"|"none"|boolean

	checkBuildMode 		?: 'dev'|'production'|'both'

	// frequency 			?: number

	batteryThreshold	?:number|'ignore'|boolean
}

const _defaultConfig:Partial<ISolidTypeCheckerPluginConfig> = {
	sounds 				: true,
	// frequency 			: 0,
	checkBuildMode		: 'both',
	batteryThreshold	: 90
}

// -----------------------------------------------------------------------------

export class SolidTypeCheckerPlugin extends SolidPlugin <ISolidTypeCheckerPluginConfig>
{
	static init ( config:ISolidTypeCheckerPluginConfig ) {
		return new SolidTypeCheckerPlugin({ name: 'typechecker', ..._defaultConfig, ...config })
	}

	protected _buildIndex 			= 0;

	protected _currentChecker		:ChildProcess;
	protected _checkingLoader		:any;

	protected _projectRoot			:string;

	protected _lastDevBuildState	:'success'|'fail'|'unknown' = 'unknown'

	protected initProjectRoot ( appOptions:IExtendedAppOptions )
	{
		// Target tsconfig.json at project's root
		this._projectRoot = path.join(appOptions.packageRoot, 'tsconfig.json');

		// Check is file exists
		const projectTsConfigFile = new File( this._projectRoot );
		if ( projectTsConfigFile.exists() ) return;

		// Compte parent relative to root tsconfig.json and write tsconfig.json file
		const relative = path.relative( path.join(this._projectRoot, '../'), './');
		projectTsConfigFile.content(untab(`
			{
			  "extends": "${relative}/tsconfig.json",
			  "include": [
				"./**/*.ts",
				"./**/*.tsx",
			  ],
			  "exclude" : [
			  	"${relative}/node_modules"
			  ],
			  "compilerOptions" : {
				"rootDir": "./",
				"baseUrl": "./"
			  }
			}
		`, 3));
		projectTsConfigFile.save();
	}

	protected typeCheck = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions ) => new Promise<void|SolidPluginException>( (resolve, reject) => {

		// Init project root
		if ( !this._projectRoot )
			this.initProjectRoot( appOptions );

		// Kill already running type checker
		if ( this._currentChecker ) {
			this._currentChecker.kill();
			this._checkingLoader && this._checkingLoader();
		}

		// Start typechecking command with tsc
		this._checkingLoader = printLoaderLine('Checking typescript ...');
		const command = `./node_modules/typescript/bin/tsc -p ${this._projectRoot} --noEmit --allowUnreachableCode --incremental --pretty`
		this._currentChecker = exec( command );

		// FIXME : Can we do better ?
		// Get tsc out and err buffers
		let outBuffer = '';
		let errBuffer = '';
		this._currentChecker.stdout.on('data', d => outBuffer += d )
		this._currentChecker.stderr.on('data', d => errBuffer += d )

		const { sounds } = this._config
		const isMac = process.platform == 'darwin'

		// Type check is finished
		this._currentChecker.once('exit', ( code ) => {
			this._currentChecker.kill();

			// Success
			if ( code === 0 ) {
				// Play success sound on mac if state changed
				if ( buildMode == 'dev' && isMac && (sounds == 'all' || sounds === true) && this._lastDevBuildState != 'success') {
					// exec(`afplay /System/Library/Sounds/Tink.aiff`)
					// exec(`afplay /System/Library/Sounds/Morse.aiff`)
					exec(`afplay /System/Library/Sounds/Ping.aiff`)
				}

				this._lastDevBuildState = 'success'
				this._checkingLoader('{b/g}Typescript validated', '👌')
				resolve();
			}

			// Fail
			else {
				if ( buildMode == 'dev' && isMac && (sounds == 'all' || sounds == 'errors' || sounds === true) ) {
					// exec(`afplay /System/Library/Sounds/Basso.aiff`)
					exec(`afplay /System/Library/Sounds/Sosumi.aiff`)
				}

				this._lastDevBuildState = 'fail'
				this._checkingLoader('Typescript error', 'error');
				newLine()

				// Pipe buffers to CLI
				process.stdout.write( outBuffer );
				process.stderr.write( errBuffer );

				buildMode == 'production' ? reject() : resolve( new SolidPluginException() );
			}

			// Remove instances
			this._currentChecker = null;
			this._checkingLoader = null;
		})
	});

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {

		const { checkBuildMode } = this._config
		if ( buildMode === 'production' && (checkBuildMode == 'both' || checkBuildMode == 'production') ) {
			try {
				await this.typeCheck( buildMode, appOptions );
			}
			catch (e) {
				process.exit(1)
			}
		}
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {
		// TODO : Optimisation, only check changed file from buildEvent if possible
		const { checkBuildMode } = this._config
		if ( buildMode === 'dev' && (checkBuildMode == 'both' || checkBuildMode == 'dev') )
		{
			// Check battery level and skip type check if not enough battery
			if ( this._config.batteryThreshold != 'ignore' && this._config.batteryThreshold !== false ) {
				const batteryPercentage = await getBatteryLevel()
				if ( batteryPercentage < (this._config.batteryThreshold ?? _defaultConfig.batteryThreshold) ) {
					nicePrint(`{d}Running on battery (${batteryPercentage}% < ${this._config.batteryThreshold}%), skipping type check.`)
					return;
				}
			}

			// TODO : Frequency skip

			await this.typeCheck( buildMode, appOptions );
		}
	}
}