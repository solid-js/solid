import { ISolidMiddleware } from "./SolidParcel";


export class SolidPlugin <C = any> implements ISolidMiddleware
{
	protected _config:C;
	get config ():C { return this._config; }

	protected _name:string
	get name () { return this._name; }

	constructor ( name:string, config:C )
	{
		this._name = name;
		this._config = config;
		this.init();
	}

	//registerActions () { }

	init () { }

	beforeBuild () { }

	afterBuild () { }
}