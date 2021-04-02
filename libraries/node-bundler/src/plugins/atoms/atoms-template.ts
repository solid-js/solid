// Do not edit code bellow this line.'
// This statement is automated.

// Import atoms from less module
const atoms = require('{{atomFilePath}}');

// Generated typed list of exported atoms
export type TExportedAtoms = {{exportedAtoms}}

// Accepted atom return format
type TAtomReturnFormat = 'raw'|'value'|'unit'

/**
 * Get an atom value from atoms module file.
 * @param property Property name to get.
 * @param format Parse CSS values, ex for 144px, extract unit from value.
 */
export function getAtom ( property:TExportedAtoms, format:TAtomReturnFormat = 'raw' )
{
	// Return full value
	const value = atoms[ property ];
	if ( format == 'raw' )
		return value

	// Split digital from alpha chars
	const split = value.match(/(\d*\.?\d*)(.*)/);
	if ( format == 'value' )
		return parseFloat( split[ 1 ] );
	else if ( format == 'unit' )
		return split[ 2 ].toLowerCase();
}