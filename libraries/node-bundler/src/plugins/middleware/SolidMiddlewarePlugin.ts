import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, ISolidMiddleware, TBuildMode } from "../../engine/SolidParcel";

// -----------------------------------------------------------------------------

interface ISolidMiddlewarePluginConfig extends Partial<ISolidMiddleware>, IBaseSolidPluginConfig { }

const _defaultConfig:Partial<ISolidMiddlewarePluginConfig> = {
	beforeBuild : () => {},
	afterBuild : () => {},
}

// -----------------------------------------------------------------------------

export class SolidMiddlewarePlugin extends SolidPlugin <ISolidMiddlewarePluginConfig>
{
	static init ( config:ISolidMiddlewarePluginConfig ) {
		return new SolidMiddlewarePlugin({ name: 'middleware', ..._defaultConfig, ...config })
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		return this._config.beforeBuild( buildMode, appOptions, envProps );
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object ) {
		return this._config.afterBuild( buildMode, appOptions, envProps )
	}
}