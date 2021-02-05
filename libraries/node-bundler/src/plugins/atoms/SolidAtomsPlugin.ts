import { IBaseSolidPluginConfig, SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidAtomsPluginConfig extends IBaseSolidPluginConfig
{
	path	?:string|string[]

	mode	?:'eof'|'json'|'ts'
}

const _defaultConfig:ISolidAtomsPluginConfig = {
	path	: 'src/app/0-atoms/atoms.module.less',
	mode	: 'eof'
}

// -----------------------------------------------------------------------------

let _config:ISolidAtomsPluginConfig;

export class SolidAtomsPlugin extends SolidPlugin <ISolidAtomsPluginConfig>
{
	static init ( config:ISolidAtomsPluginConfig ) {
		return new SolidAtomsPlugin({ name: 'atoms', ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}