import { IBaseSolidPluginConfig, SolidPlugin, SolidPluginException } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";
import { ChildProcess, exec } from "child_process";
import { printLoaderLine } from "@solid-js/cli";
import { delay, untab } from "@solid-js/core";
import { File, FileFinder } from "@solid-js/files";
import path from "path";

// -----------------------------------------------------------------------------

interface ISolidTypeCheckerPluginConfig extends IBaseSolidPluginConfig {

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
		return new SolidTypeCheckerPlugin({ name: 'typechecker', ..._defaultConfig, ...config })
	}

	protected _buildIndex 			= 0;

	protected _currentChecker		:ChildProcess;
	protected _checkingLoader		:any;

	protected _projectRoot			:string;

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

		// TODO : Implement frequency check

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
		this._currentChecker.once('exit', ( code ) => {
			this._currentChecker.kill();

			// Success
			if ( code === 0 ) {
				// TODO : Sound
				this._checkingLoader('Typescript validated', '👌')
				resolve();
			}

			// Fail
			else {
				// Pipe buffers to CLI
				process.stdout.write( outBuffer );
				process.stderr.write( errBuffer );

				// TODO : Sound
				this._checkingLoader('Typescript error', 'error');
				buildMode == 'production' ? reject() : resolve( new SolidPluginException() );
			}

			// Remove instances
			this._currentChecker = null;
			this._checkingLoader = null;
		})
	});

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {

		if ( buildMode === 'production' )
			await this.typeCheck( buildMode, appOptions );
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {
		// TODO : Optimisation, only check changed file from buildEvent;
		if ( buildMode === 'dev')
			await this.typeCheck( buildMode, appOptions );
	}
}