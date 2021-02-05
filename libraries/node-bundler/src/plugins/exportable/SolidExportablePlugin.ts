import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidExportablePluginConfig extends IBaseSolidPluginConfig
{
	[key:string] : string|{
		input	:string
		output	:string
		// TODO ...
	}
}

const _defaultConfig:Partial<ISolidExportablePluginConfig> = {

}

// -----------------------------------------------------------------------------

export class SolidExportablePlugin extends SolidPlugin <ISolidExportablePluginConfig>
{
	static init ( config:ISolidExportablePluginConfig ) {
		return new SolidExportablePlugin({ name: 'exportable', ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}