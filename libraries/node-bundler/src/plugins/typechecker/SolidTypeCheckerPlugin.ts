import { IBaseSolidPluginConfig, ICommand, SolidPlugin, SolidPluginException } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from "child_process";
import { newLine, nicePrint, printLoaderLine } from "@solid-js/cli";
import { delay, untab } from "@solid-js/core";
import { File } from "@solid-js/files";
import path from "path";
import { getBatteryLevel } from "../../engine/SolidUtils";

/**
 * TODO v1.2 :
 * - Frequency check
 */

// ----------------------------------------------------------------------------- STRUCT

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

// ----------------------------------------------------------------------------- CONFIG

const isMac = process.platform == 'darwin'

const _sounds = {
	'success' 	: 'Ping', 	// Tink / Morse
	'fail' 		: 'Sosumi', // Basso
}

function playSound ( type:string )
{
	if ( !isMac ) return
	exec(`afplay /System/Library/Sounds/${_sounds[type]}.aiff`)
}

// ----------------------------------------------------------------------------- PLUGIN

export class SolidTypeCheckerPlugin extends SolidPlugin <ISolidTypeCheckerPluginConfig>
{
	static init ( config:ISolidTypeCheckerPluginConfig ) {
		return new SolidTypeCheckerPlugin({ name: 'typechecker', ..._defaultConfig, ...config })
	}

	// protected _buildIndex 			= 0;

	protected _currentChecker		:ChildProcess;
	protected _checkingLoader		:any;

	protected _projectRoot			:string;

	protected _lastDevBuildState	:'success'|'fail'|'unknown' = 'success'

	protected initProjectRoot ( appOptions:IExtendedAppOptions )
	{
		// Target tsconfig.json at project's root
		this._projectRoot = path.join(appOptions.packageRoot, 'tsconfig.json');
		const projectTsConfigFile = new File( this._projectRoot );

		// Target relative source route
		const relativeSourceRoot = path.relative( appOptions.packageRoot, appOptions.sourcesRoot )

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
			    "${relative}/node_modules",
			    "./node_modules",
			  ],
			  "compilerOptions" : {
			    "rootDir": "${relativeSourceRoot}",
			    "baseUrl": "./"
			  }
			}
		`, 3));
		projectTsConfigFile.saveAsync();
	}

	protected typeCheck = ( buildMode:TBuildMode, appOptions:IExtendedAppOptions ) => new Promise<void|SolidPluginException>( async (resolve, reject) => {

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

		// Type check is finished
		this._currentChecker.once('exit', async ( code ) => {
			// Dispose
			this._currentChecker.kill()
			this._currentChecker.removeAllListeners()

			// Killed by code, do not continue
			if ( code === null) {
				this._checkingLoader && this._checkingLoader();
				return;
			}

			const { sounds } = this._config

			// Success
			if ( code === 0 )
			{
				// Play success sound on mac if state changed
				if ( buildMode == 'dev' && (sounds == 'all' || sounds === true) && this._lastDevBuildState != 'success')
					playSound('success')

				// Confirm success state
				this._lastDevBuildState = 'success'
				this._checkingLoader('{b/g}Typescript validated', '👌')
				resolve();
			}

			// Fail
			else
			{
				// Play error sound on mac if state changed
				if ( buildMode == 'dev' && (sounds == 'all' || sounds == 'errors' || sounds === true) )
					playSound('fail')

				// Confirm fail state
				this._lastDevBuildState = 'fail'
				this._checkingLoader('Typescript error ' + code, 'error');
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

	async prepare ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions )
	{
		// Init project root tsconfig now to avoid dealing with watch loops
		// ( json file creation causing a new build )
		this.initProjectRoot( appOptions );
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {
		// In production, we check code before building step
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

	protected _firstDevBuild = true;

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {

		if ( buildError ) return;

		// In dev mode, we check code after each build (first build and watch triggers)
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

			if ( this._firstDevBuild ) {
				this._firstDevBuild = false
				await this.typeCheck( buildMode, appOptions );
				return
			}

			this.typeCheck( buildMode, appOptions );
		}
	}

	async action ( command:ICommand, appOptions?:IExtendedAppOptions )
	{
		// Remove generated tsconfig files on clean action
		if ( command.command === 'clean' ) {
			new File( path.join(appOptions.packageRoot, 'tsconfig.json') ).remove();
			new File( path.join(appOptions.packageRoot, 'tsconfig.tsbuildinfo') ).remove();
		}
	}
}