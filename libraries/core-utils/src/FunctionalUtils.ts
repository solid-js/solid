export module FunctionalUtils
{
	/**
	 * Create a function to map values from input to output with ranges.
	 * TODO : Better Doc
	 *
	 * Example :
	 * const opacityValueMap = [
	 * 	[v => v >= 0 && v <= 1, r => r],
	 * 	[v => v >= 3 && v <= 4, r => 1 - (r - 3)],
	 * 	[r => 0]
	 * ];
	 *
	 * const mapped = functionalValueMap( opacityValueMap );
	 *
	 * mapped( -1 )	 	// 0
	 * mapped( 0 )	 	// 0
	 * mapped( .5 ) 	// .5
	 * mapped( 1 ) 		// 1
	 * mapped( 2 ) 		// 1
	 * mapped( 3 ) 		// 1
	 * mapped( 3.5 ) 	// .5
	 * mapped( 4 ) 		// 0
	 * mapped( 5 ) 		// 0
	 *
	 */
	export function functionalValueMap <GType> ( valuesMap: ( (r:GType) => GType|boolean)[][] )
	{
		// This is a Higher Order Function.
		// Set your map once to create a function which will convert values.
		return function ( value:GType )
		{
			// Browse value maps
			for ( let i = 0; i < valuesMap.length; i ++ )
			{
				// Target current value map
				const currentMap = valuesMap[i];

				// Test with first function if the value have to be mapped with this map
				const test = currentMap[0]( value );

				// If this is not compatible, try next value map
				if ( !test ) continue;

				// If this is compatible
				return (
					// Map value with second function if it exists
					( 1 in currentMap )
					? valuesMap[i][1]( value )
					// Otherwise returns first test function value
					: test
				);
			}

			// If nothing is found, return value without mapping
			return value;
		}
	}
}
