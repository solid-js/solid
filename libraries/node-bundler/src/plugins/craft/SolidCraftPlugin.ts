import { SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidCraftPluginConfig
{
	paths		?:string[]
}

const _defaultConfig:Partial<ISolidCraftPluginConfig> = {
}

// -----------------------------------------------------------------------------

let _config:ISolidCraftPluginConfig;

export class SolidCraftPlugin extends SolidPlugin <ISolidCraftPluginConfig>
{
	static init ( config:ISolidCraftPluginConfig ) {
		return new SolidCraftPlugin('craft', { ..._defaultConfig, ...config })
	}


}