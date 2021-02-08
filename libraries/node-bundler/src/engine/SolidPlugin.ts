import { IExtendedAppOptions, ISolidMiddleware, TBuildMode } from "./SolidParcel";


export interface IBaseSolidPluginConfig
{
	// Custom plugin name
	name	?:	string
}

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

export class SolidPlugin <C extends IBaseSolidPluginConfig = any> implements ISolidMiddleware
{
	protected _config:C;
	get config ():C { return this._config; }

	protected _name:string
	get name () { return this._name; }

	constructor ( config:C )
	{
		this._name = config.name;
		this._config = config;
		this.init();
	}

	init () { }

	prepare ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions ) { }
	beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {}
	afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) { }
	clean ( appOptions?:IExtendedAppOptions ) {}
}