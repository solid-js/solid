import { SolidPlugin } from "../../engine/SolidPlugin";
import { IAppOptions, ISolidMiddleware, TBuildMode } from "../../engine/Solid";

// -----------------------------------------------------------------------------

interface ISolidMiddlewarePluginConfig extends Partial<ISolidMiddleware> { }

const _defaultConfig:Partial<ISolidMiddlewarePluginConfig> = {
	beforeBuild : () => {}, // TODO : Remplace noop lib
	afterBuild : () => {}, // TODO : Remplace noop lib
}

// -----------------------------------------------------------------------------

export class SolidMiddlewarePlugin extends SolidPlugin <ISolidMiddlewarePluginConfig>
{
	static init ( config:ISolidMiddlewarePluginConfig ) {
		return new SolidMiddlewarePlugin('middleware', { ..._defaultConfig, ...config })
	}

	beforeBuild ( appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object ) {
		this._config.beforeBuild( appOptions, buildMode, envProps );
	}

	afterBuild ( appOptions?:IAppOptions, buildMode?:TBuildMode, envProps?:object ) {
		this._config.afterBuild( appOptions, buildMode, envProps )
	}
}