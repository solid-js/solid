import { IBaseSolidPluginConfig, ICommand, ISolidMiddleware, SolidPlugin } from "../../engine/SolidPlugin";
import { IExtendedAppOptions, TBuildMode } from "../../engine/SolidParcel";

// -----------------------------------------------------------------------------

interface ISolidMiddlewarePluginConfig extends Partial<ISolidMiddleware>, IBaseSolidPluginConfig { }

const _defaultConfig:Partial<ISolidMiddlewarePluginConfig> = {
	prepare: ( buildMode, appOptions ) => { },
	beforeBuild: ( buildMode, appOptions, envProps, buildEvent, buildError ) => { },
	afterBuild: ( buildMode, appOptions, envProps, buildEvent, buildError ) => { },
	action: ( command, appOptions ) => { },
}

// -----------------------------------------------------------------------------

export class SolidMiddlewarePlugin extends SolidPlugin <ISolidMiddlewarePluginConfig>
{
	static init ( config:ISolidMiddlewarePluginConfig ) {
		return new SolidMiddlewarePlugin({ name: 'middleware', ..._defaultConfig, ...config })
	}

	async prepare ( buildMode:TBuildMode, appOptions?:IExtendedAppOptions ) {
		return this._config.prepare( buildMode, appOptions );
	}

	async beforeBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {
		return this._config.beforeBuild( buildMode, appOptions, envProps, buildEvent, buildError );
	}

	async afterBuild ( buildMode?:TBuildMode, appOptions?:IExtendedAppOptions, envProps?:object, buildEvent?, buildError? ) {
		return this._config.afterBuild( buildMode, appOptions, envProps, buildEvent, buildError )
	}

	async action ( command:ICommand, appOptions?:IExtendedAppOptions ) {
		return this._config.action( command, appOptions );
	}
}