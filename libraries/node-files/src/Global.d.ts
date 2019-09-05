/**
 * Any low level handler type matcher
 * - Any type of return or void
 * - Any number of arguments of any type
 */
export type AnyHandler = (...rest) => any|void;

/**
 * Functional transformer with generic. Describes :
 * - a function which have only one argument of type GType
 * - and returns a value of type GType
 */
export type TFunctionalTransformer <GType> = ( r:GType ) => GType

/**
 * Any scalar value which can hold data and not structure :
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

/**
 * Any object containing only one level of depth of data.
 * Can contain Scalar values or Functional handlers.
 * - String bases key (associative)
 * - Scalar values allowed (no nesting)
 * - Functions as value allowed
 */
export type OneLevelScalarFunctionalObject = {
	[key:string] : ScalarValue | AnyHandler
}