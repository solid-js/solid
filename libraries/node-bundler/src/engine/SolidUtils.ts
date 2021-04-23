import path from "path";

/**
 * Get list of changed files from a parcel build event.
 */
export function getChangedAssetsFromBuildEvent ( buildEvent, includeErrors = true )
{
	let assetPaths = []

	// Add updated files
	if ( buildEvent.changedAssets ) {
		const changedAssets = buildEvent.changedAssets as Map<string, {filePath:string}>;
		for ( const [key, asset] of changedAssets ) {
			if ( !asset.filePath ) continue
			assetPaths.push( path.resolve(asset.filePath) )
		}
	}

	// Add errors
	if ( buildEvent.type == 'buildFailure' && buildEvent.diagnostics ) {
		buildEvent.diagnostics.map( diagnostic => {
			if ( !diagnostic.filePath ) return
			assetPaths.push( path.resolve( diagnostic.filePath ) )
		})
	}

	return assetPaths
}

// TODO : Add read .env helper here
// TODO : So it's available in solid.js

// TODO : DOC
// TODO -> To node core or stuff like that
export const getBatteryLevel = () => new Promise( resolve => {
	const { platform } = process
	const _commands = {
		// TODO : TO Test
		'linux': 'upower -i /org/freedesktop/UPower/devices/battery_BAT0 | grep -E "state|time to empty|to full|percentage"',
		'darwin': 'pmset -g batt | egrep "([0-9]+\%).*" -o',
		// TODO : To test
		'win32': 'WMIC Path Win32_Battery',
	}

	if (!(platform in _commands))
		return resolve( 101 )

	require('child_process').exec(_commands[platform], (err, stdout, stderr) => {
		if ( typeof stdout === 'string' ) {
			const percentage = parseFloat(stdout.split('%')[0])
			resolve( percentage )
		}
	});
});