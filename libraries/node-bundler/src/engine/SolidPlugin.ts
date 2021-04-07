import { IExtendedAppOptions, TBuildMode } from "./SolidParcel";
import { newLine, nicePrint } from "@solid-js/cli";

// ----------------------------------------------------------------------------- STRUCT

export type TMiddlewareType = "prepare"|"beforeBuild"|"afterBuild"|"action";

export interface ICommand
{
	command   	:string
	parameters 	:object
}

export interface ISolidMiddleware
{
	prepare ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions ) : Promise<any>|void|null
	beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null
	afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) : Promise<any>|void|null
	action ( command:ICommand, appOptions?:IExtendedAppOptions ):Promise<any> | void | null
}

export interface IBaseSolidPluginConfig
{
	// Custom plugin name
	name	?:	string
}

// ----------------------------------------------------------------------------- EXCEPTION

export class SolidPluginException extends Error
{
	public message	:string;
	public code 	:number;
	public object	:any;

	constructor ( code = 1, message?:string, object? )
	{
		super();
		this.message = message;
		this.code = code;
		this.object = object;
	}
}

// ----------------------------------------------------------------------------- SOLID PLUGIN CLASS

export class SolidPlugin <C extends IBaseSolidPluginConfig = any> implements ISolidMiddleware
{
	// ------------------------------------------------------------------------- PROPERTIES

	protected _config:C;
	get config():C { return this._config; }

	protected _name:string
	get name () { return this._name; }

	// ------------------------------------------------------------------------- INIT

	constructor ( config:C )
	{
		this._name = config.name;
		this._config = config;
		this.init();
	}

	init()
	{
	}

	// ------------------------------------------------------------------------- ERROR

	protected halt ( method:string, message:string, code = 1 ) {
		// FIXME : Add app name if possible
		nicePrint(`{b/r}${this.constructor.name}.${method} {${this._config.name}} error : \n${message}`, { code })
	}

	// ------------------------------------------------------------------------- MIDDLEWARES

	prepare ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions ) { }

	beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) { }

	afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) { }

	action ( command:ICommand, appOptions?:IExtendedAppOptions ) { }
}