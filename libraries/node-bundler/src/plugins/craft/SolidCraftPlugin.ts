import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidCraftPluginConfig extends IBaseSolidPluginConfig
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
		return new SolidCraftPlugin({ name: 'craft', ..._defaultConfig, ...config })
	}


}