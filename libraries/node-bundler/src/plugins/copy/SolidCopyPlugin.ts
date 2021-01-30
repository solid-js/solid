import { SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidCopyPluginConfig
{
	[key:string] : {
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
		return new SolidCopyPlugin('copy', { ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}