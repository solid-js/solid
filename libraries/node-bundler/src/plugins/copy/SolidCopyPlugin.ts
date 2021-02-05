import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidCopyPluginConfig extends IBaseSolidPluginConfig
{
	[key:string] : string|{
		from: string,
		to: string
	}
}

const _defaultConfig:Partial<ISolidCopyPluginConfig> = {

}

// -----------------------------------------------------------------------------

export class SolidCopyPlugin extends SolidPlugin <ISolidCopyPluginConfig>
{
	static init ( config:ISolidCopyPluginConfig ) {
		return new SolidCopyPlugin({ name: 'copy', ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}