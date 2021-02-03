/**
 * TODO DOC
 * @param line
 * @param char
 */
export function countStartingChars ( line:string, char = "	" ):number
{
	let stopCounting = false;
	let total = 0
	line.split("	").filter( t => {
		if ( stopCounting ) return;
		if ( t !== '' ) stopCounting = true;
		total ++;
	});
	return total;
}

/**
 * TODO DOC
 * @param content
 * @param level
 */
export function untab ( content:string, level:"last"|"auto"|number = "last" ):string
{
	const lines = content.split("\n");

	let totalTabsToRemove:number = 0;

	if ( typeof level === 'number' )
		totalTabsToRemove = level;

	else if ( level === 'last' )
		totalTabsToRemove = countStartingChars( lines[ lines.length - 1 ] ) - 1;

	else if ( level === 'auto' )
	{
		totalTabsToRemove = -1;
		lines.map( (line, i) => {
			if ( i == 0 ) return;
			const count = countStartingChars( line );
			totalTabsToRemove = (
				totalTabsToRemove == -1 ? count
				: Math.min( totalTabsToRemove, count )
			);
		});
	}

	totalTabsToRemove = Math.max(0, totalTabsToRemove);

	const regex = new RegExp(`\n(\\t){${totalTabsToRemove}}`, 'gmi');
	console.log('->', level, totalTabsToRemove, regex);
	return content.replace( regex, "\n" );
}