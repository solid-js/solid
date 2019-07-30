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