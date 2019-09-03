
/**
 * Cache of all regexed, stored by delimiters
 */
const regexCache:{[key:string] : RegExp} = {};

/**
 * Create a template detector regex from delimiters.
 * @param delimiters Needs by an array of two strings (opening and closing delimiters)
 */
function getRegex ( delimiters:string[] ):RegExp
{
    // Create regex as string
    const regexAsString = `${delimiters[0]}(.*?)${delimiters[1]}`;

    // Create regex if needed and add it to regexes cache
    if ( !(regexAsString in regexCache) )
    {
        // Create regex from delimiters
        // We need to add a lazy ? to get closer delimiters
        regexCache[ regexAsString ] = new RegExp( regexAsString, 'gm' );
    }

    // Return created regex
    return regexCache[ regexAsString ];
}

/**
 * Get processed value from values bag.
 * Can return string / number / boolean ... Value is not casted to string.
 * Will call function if value is a function, and will return function result.
 * @param valueName Property name of the value to get from value bag
 * @param values One level deep value bag containing properties and values as scalar or functions
 */
function processValue ( valueName, values )
{
    // Silently fail as empty string if value is not found
    if ( !(valueName in values) ) return '';

    // Get raw value
    const value = values[ valueName ];

    // Call function or return value
    return ( typeof value === 'function' ? value.call( values, values ) : value );
}

/**
 * Called each time the regex find an mustache delimited variable
 * @param match Detected mustache match ( without delimiters )
 * @param values One level deep value bag containing properties and values as scalar or functions
 */
function matcher ( match, values )
{
    // Removed spaces
    const trimmed = match.trim();

    // Try to detect ternaries
    const ternaryDelimiter0 = trimmed.indexOf('?');
    const ternaryDelimiter1 = trimmed.indexOf(':');
    if ( ternaryDelimiter0 > 0 && ternaryDelimiter1 > 0 )
    {
        // Get value name from ternary ( valueName ? truePart : falsePart ) and then get processed value
        const ternaryValueName = trimmed.substring( 0, ternaryDelimiter0 ).trim();
        const ternaryCondition = processValue( ternaryValueName, values );

        // Execute condition and return trimmed truePart or trimmed falsePart
        return (
            ternaryCondition
            ? trimmed.substring( ternaryDelimiter0 + 1, ternaryDelimiter1 ).trim()
            : trimmed.substring( ternaryDelimiter1 + 1, trimmed.length ).trim()
        );
    }

    // No ternary, process value
    return processValue( trimmed, values );
}

/**
 * Process a template as string with values.
 * Values needs to be a one level deep associative object ( key : value ).
 * Why do you need Nanostache since literal template strings are available in ES6+ ?
 * Nanostache can be useful when any templating is needed when the template is not coming
 * from javascript itself. For example, if you need to process a template from a file, or
 * any other kind of input.
 *
 * Example :
 * Nanostache('Hello {{username}}', {
 *   username: 'James Bond'
 * });
 * -> 'Hello James Bond'
 *
 * Values can be functions :
 * const user = { balance : 12 };
 * Nanostache('Your current balance is {{balance}}€', {
 *   balance: () => user.balance
 * });
 * -> 'Your current balance is 12€'
 *
 * Ternary conditions can be used :
 * Nanostache('Condition is {{test ? truthy : falsy}}', {
 *   test: 0
 * });
 * -> 'Condition is falsy'
 *
 * Or, with the help of functions :
 * Nanostache('{{name}} is {{age}} {{isAgePlural ? years : year}} old', {
 *    name: 'Brad Pitt',
 *    age: 55,
 *    isAgePlural: v => v.age > 1
 * });
 * -> 'Brad Pitt is 55 years old'
 *
 * Complex example mixing functions and ternary :
 * const user = {
 *     name: 'James Bond',
 *     gender: 'male',
 *     balance: 15
 * }
 * Nanostache('Hello {{ isMale ? mr : mrs }} {{ getLastName }}. Your balance is {{ balance }}€.', {
 *   ...user,
 *   isMale: () => user.gender == 'male',
 *   getLastName: () => user.name.split(' ')[1]
 * });
 * -> 'Hello mr Bond. Your balance is 15€.'
 *
 * Delimiters can be changed if needed :
 * Nanostache('Hello #name#', { name: 'John Malkovich' }, ['#', '#']
 * -> 'Hello John Malkovich'
 *
 * @param template Template to process with delimiters and values.
 * @param values One level deep value bag containing properties and values as scalar or functions
 * @param delimiters Needs by an array of two strings (opening and closing delimiters)
 */
export function Nanostache ( template, values, delimiters = ['{{', '}}'] )
{
	return template.replace(
	    getRegex( delimiters ),
        (i, m) => matcher( m, values )
    );
}