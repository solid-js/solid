import { SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidExportablePluginConfig
{
	[key:string] : {
		input	:string
		output		:string
		// TODO ...
	}
}

const _defaultConfig:Partial<ISolidExportablePluginConfig> = {

}

// -----------------------------------------------------------------------------

export class SolidExportablePlugin extends SolidPlugin <ISolidExportablePluginConfig>
{
	static init ( config:ISolidExportablePluginConfig ) {
		return new SolidExportablePlugin('exportable', { ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}