import { SolidPlugin } from "../../engine/SolidPlugin";

// -----------------------------------------------------------------------------

interface ISolidAtomsPluginConfig
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
		return new SolidAtomsPlugin('atoms', { ..._defaultConfig, ...config })
	}

	beforeBuild ()
	{

	}

	afterBuild ()
	{

	}
}