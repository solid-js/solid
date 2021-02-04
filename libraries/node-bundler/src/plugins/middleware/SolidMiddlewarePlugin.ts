import { SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, ISolidMiddleware, TBuildMode } from "../../engine/SolidParcel";

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

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		return this._config.beforeBuild( buildMode, appOptions, envProps );
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		return this._config.afterBuild( buildMode, appOptions, envProps )
	}
}