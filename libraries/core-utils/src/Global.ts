/**
 * TODO : trouver un moyen de mutualiser ce fichier sur toutes les libraries sans se taper
 * TODO : ce problème :
 * error TS6059: File '/Users/zouloux/Documents/local/_framework/solid/libraries/core-utils/src/Global.ts' is not under 'rootDir' '/Users/zouloux/Documents/local/_framework/solid/libraries/web-yadl/src'. 'rootDir' is expected to contain all source files.
 */


/**
 * Any low level handler type matcher
 * - Any type of return or void
 * - Any number of arguments of any type
 */
export type AnyHandler = (...rest) => any|void;


/**
 * Any scalar value which can hold data :
 * - string
 * - number
 * - boolean
 */
export type ScalarValue = (string | number | boolean);

/**
 * Any object containing only scalar values
 * - String bases key (associative)
 * - Only scalar values allowed (no nesting)
 */
export type ScalarObject = {
	[key:string] : ScalarValue
};