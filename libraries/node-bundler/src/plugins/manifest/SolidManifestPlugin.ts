import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { IAppOptions, TBuildMode } from "../../engine/SolidParcel";
import * as path from "path";

// -----------------------------------------------------------------------------

interface ISolidManifestPluginConfig extends IBaseSolidPluginConfig
{
	/**
	 * Filter manifest before writing file.
	 * You can add or remove properties
	 * Ex : manifest.base = envProps.base;
	 * Ex : delete manifest.files.script;
	 */
	filterManifest 	?: ( manifest:Partial<IManifest>, appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object ) => Partial<IManifest>

	/**
	 * Output complete file path. Always a json file.
	 * If not defined, will be inside output bundle directory along bundle files.
	 * Ex : public/manifest.json
	 */
	output 			?: string
}

interface IManifest
{
	version:string
	files : {
		// All keys are compatible with rel preload "as"
		// @see https://developer.mozilla.org/fr/docs/Web/HTML/Pr%C3%A9charger_du_contenu
		audio 		?:string[]
		document 	?:string[]
		embed 		?:string[]
		fetch 		?:string[]
		font 		?:string[]
		image 		?:string[]
		object 		?:string[]
		script 		?:string[]
		style 		?:string[]
		track 		?:string[]
		worker 		?:string[]
		video 		?:string[]
	}
}

const _defaultConfig:Partial<ISolidManifestPluginConfig> = {}

// -----------------------------------------------------------------------------

export class SolidManifestPlugin extends SolidPlugin <ISolidManifestPluginConfig>
{
	static init ( config:ISolidManifestPluginConfig ) {
		return new SolidManifestPlugin({ name: 'middleware', ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ( appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object )
	{
		// // TODO : Read output folder structure
		//
		// // TODO : Generate manifest from file list and extensions
		// let manifest:Partial<IManifest> = {
		// 	version : 'package.version',
		// 	files: {
		// 		font : [ // todo : key is compatible with preload[as]
		// 			'static/typo-regular.woff',
		// 			'static/typo-bold.woff',
		// 		],
		// 		script : [
		// 			'static/index.js'
		// 		],
		// 		style : [
		// 			'static/index.css'
		// 		],
		// 		image : [
		//
		// 		]
		// 	}
		// }
		//
		// // Filter manifest
		// if ( this._config.filterManifest )
		// 	manifest = this._config.filterManifest( manifest, appOptions, buildMode, envProps )
		//
		// const output = this._config.output ?? path.join( appOptions.output, '/manifest.json')
		//
		// // TODO : Write manifest file to destination
	}
}