/**
 * Get list of changed files from a parcel build event.
 */
export function getChangedAssetsFromBuildEvent ( buildEvent )
{
	const changedAssets = buildEvent.changedAssets as Map<string, {filePath:string}>;
	if (!changedAssets) return []
	let assetPaths = []
	for ( const [key, asset] of changedAssets )
		assetPaths.push( asset )
	return assetPaths
}