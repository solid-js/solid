import { ScalarObject } from "@solid-js/global";


export module StringUtils
{
    // ------------------------------------------------------------------------- FORMATTING

    /**
     * Prepend a number by a fixed number of zeros.
     *
     * For ex :
     * - 17 can become 00017
     *
     * Useful to target sprites or some renamed files.
     *
     * @param totalChars Total chars of output string (with added zeros)
     * @param number Base number
     * @param placeholder Default is a 0 char but can be changed
     * @returns Zero formatted number.
     */
    export function zeroFill (totalChars:number, number:number, placeholder = '0'):string
    {
        // Convert number to string and count chars
        const currentNumberAsString = number.toString();
        const totalCharsInCurrentNumber = currentNumberAsString.length;

        // Formatted output
        let output = '';

        // If we miss some zeros
        if (totalCharsInCurrentNumber < totalChars)
        {
            // Add corresponding number of zeros
            const missingZeros = ( totalChars - totalCharsInCurrentNumber );
            for (let i = 0; i < missingZeros; i ++)
            {
                output += placeholder;
            }
        }

        // Return formatted string
        return output + currentNumberAsString;
    }

    /**
     * Add or remove the trailing char at the end of a path.
     *
     * For ex:
     * - "/lib/test" becomes "/lib/test/" if add is true
     * - "/lib/test/" becomes "/lib/test" if add is false
     *
     * @param source String path with or without trailing char
     * @param add Will add char or remove slash.
     * @param char Default is a slash ( / ) but can be changed
     * @returns patched source with or without trailing char
     */
    export function trailing (source:string, add = true, char = '/'):string
    {
        // If we currently have a trailing char
        const hasTrailingSlash = ( source.lastIndexOf( char ) == source.length - 1 );

        // If we have to add trailing char
        if (add && !hasTrailingSlash)
        {
            return source + char;
        }

        // If we have to remove trailing char
        else if (!add && hasTrailingSlash)
        {
            return source.substr(0, source.length - 1);
        }

        // Do nothing
        else return source;
    }

    /**
     * Add or remove the leading char at the start of a path.
     *
     * For ex:
     * - "lib/test/" becomes "/lib/test/" if add is true
     * - "/lib/test/" becomes "lib/test/" if add is false
     *
     * @param source String path with or without leading char
     * @param add Will add char or remove char.
     * @param char Default is a slash ( / ) but can be changed
     * @returns patched source with or without leading char
     */
    export function leading (source:string, add = true, char = '/'):string
    {
        // If we currently have a leading char
        const hasLeadingSlash = ( source.indexOf( char ) == 0 );

        // If we have to add leading char
        if (add && !hasLeadingSlash)
        {
            return char + source;
        }

        // If we have to remove leading char
        else if (!add && hasLeadingSlash)
        {
            return source.substr(1, source.length);
        }

        // Do nothing
        else return source;
    }

    /**
     * First letter capital on given string.
     * For ex: "courgette? Oui!" become "Courgette, Oui!"
     */
    export function upperCaseFirstChar (source:string):string
    {
        return source.substr(0, 1).toUpperCase() + source.substr(1, source.length);
    }

    /**
     * First letter in low case on given string.
     * For ex: "Fromage? Oui!" become "fromage? Oui!"
     */
    export function lowerCaseFirstChar (source:string):string
    {
        return source.substr(0, 1).toLowerCase() + source.substr(1, source.length);
    }

    /**
     * Convert a dash case formatted string to a camel case format.
     *
     * Ex: "my-string" will be converted to "myString"
     */
    export function dashToCamelCase (source:string, separator = '-'):string
    {
        // Seperate dashs
        const split = source.toLowerCase().split(separator);
        const total = split.length;

        // Return raw if it's not a dash
        if (total < 2) return source.toLowerCase();

        // The first is not uppercase
        let out = split[0];

        // Others are upper cased first
        for (let i = 1; i < total; i ++)
        {
            out += (i == 0 ? split[i] : StringUtils.upperCaseFirstChar(split[i]));
        }

        return out;
    }

    /**
     * Convert camelCase to dash_case or dash-case or DASH_CASE and even DASH-CASE
     * @param source camelCase string
     * @param separator Used separator between words. Default is dash -
     * @param upperCase If we have to uppercase every words. Default is no thanks.
     * @returns {string} dash-case-string or dash_case_string
     */
    export function camelToDashCase (source:string, separator = '-', upperCase = false):string
    {
        return source.replace(
            /([A-Z])/g,
            ( part:string ) => (
                separator + ( upperCase ? part.toUpperCase() : part.toLowerCase() )
            )
        );
    }

    /**
     * Convert an enum value from an enum object to a dash-case string
     * @param enumObject ex : EMyEnum
     * @param enumValue ex : EMyEnum.MY_VALUE -> my-value
     */
    export function enumToDash (enumObject:Object, enumValue:number)
    {
        // On converti en dashCase
        return enumObject[ enumValue ].toLowerCase().split('_').join('-');
    }

    /**
     * Convert an enum value from an enum object to a camelCase string
     * @param enumObject ex : EMyEnum
     * @param enumValue ex : EMyEnum.MY_VALUE -> myValue
     * @param capitalizeFirst to set first letter to uppercase
     */
    export function enumToCamel (enumObject:Object, enumValue:number, capitalizeFirst = false)
    {
        const camel = StringUtils.dashToCamelCase(
            StringUtils.enumToDash( enumObject, enumValue )
        );

        return (
            capitalizeFirst
            ? StringUtils.upperCaseFirstChar( camel )
            : camel
        );
    }

    /**
     * Trouver un index enum depuis son nom en string.
     * Ne prend en charge que le nom exacte de l'enum, par exemple ENum.MY_VALUE sera associé uniquement avec le string "MY_VALUE"
     * Cette méthode va convertir automatiquement le dash-case vers FORMAT_ENUM
     * Retourne -1 si la valeur n'a pas été trouvée.
     * @param pString Le nom de la valeur à trouver, par ex : "MY_VALUE"
     * @param pEnumClass La classe de l'enum, par ex: ENum
     * @returns {number} L'index de notre valeur enum qui correspond au string. -1 si non trouvé.
     */
    export function stringToEnum (pString:string, pEnumClass:Object):number
    {
        // Patcher notre dash-case
        let patchedString = pString.toUpperCase().split('-').join('_');

        // Parcourir tous les indexs
        let index = 0;
        do
        {
            // Si notre index correspond à la valeur recherchée
            if (pEnumClass[index] == patchedString)
            {
                // On retourne l'index
                return index;
            }

            // Sinon on passe au suivant
            index++;
        }
        while (index in pEnumClass);

        // On n'a pas trouvé
        return -1;
    }

    /**
     * Get file name from any path.
     * Will return full string if no slash found.
     * ex : 'usr/bin/TestFile' will return 'TestFile'
     */
    export function getFileFromPath (path:string):string
    {
        let lastIndex = path.lastIndexOf('/');

        if (lastIndex == -1)
        {
            lastIndex = 0;
        }

        return path.substring(lastIndex + 1, path.length);
    }

    /**
     * Get the base folder from any path.
     * Will include trailing slash.
     * Will return full string if no slash found.
     * ex: 'usr/bin/TestFile' will return 'usr/bin/'
     */
    export function getBaseFromPath (path:string):string
    {
        let lastIndex = path.lastIndexOf('/');

        if (lastIndex == -1)
        {
            lastIndex = path.length;
        }

        return path.substring(0, lastIndex);
    }

    /**
     * Get the local path from a full path and a base.
     * For ex : will extract /dir/file.html from /my/base/dir/file.html with base /my/base
     * To work, base have to be the exact beginning of path. This is to avoid issues with bases like '/'
     * If base is invalid, path will be returned.
     * No error thrown.
     * If you want starting slash or not, please use StringUtils.trailingSlash method on path and / or pBase
     */
    export function extractPathFromBase (path:string, base:string):string
    {
        // Get the index of base within the path
        let baseStartIndex = path.indexOf( base );

        return (
            // Base is starting path so its ok
            baseStartIndex == 0
            ? path.substr( base.length, path.length )
            // Invalid base for this path, do nothing
            : path
        );
    }

    /**
     * Converting ASCII special chars to slug regular chars (ex: 'héhé lol' is converted to 'hehe-lol')
     * Handy for URLs
     */
    export const SLUG_REGEX = [ {
        regex: /[\xC0-\xC6]/g,
        char: 'A'
    }, {
        regex: /[\xE0-\xE6]/g,
        char: 'a'
    }, {
        regex: /[\xC8-\xCB]/g,
        char: 'E'
    }, {
        regex: /[\xE8-\xEB]/g,
        char: 'e'
    }, {
        regex: /[\xCC-\xCF]/g,
        char: 'I'
    }, {
        regex: /[\xEC-\xEF]/g,
        char: 'i'
    }, {
        regex: /[\xD2-\xD6]/g,
        char: 'O'
    }, {
        regex: /[\xF2-\xF6]/g,
        char: 'o'
    }, {
        regex: /[\xD9-\xDC]/g,
        char: 'U'
    }, {
        regex: /[\xF9-\xFC]/g,
        char: 'u'
    }, {
        regex: /[\xC7-\xE7]/g,
        char: 'c'
    }, {
        regex: /[\xD1]/g,
        char: 'N'
    }, {
        regex: /[\xF1]/g,
        char: 'n'
    }
    ];

    /**
     * Converting a string for URL's.
     * For ex : "I'm a robot" will be converted to "im-a-robot"
     */
    export function slugify (input:string):string
    {
        // Replace all non URL compatible chars
        const total = this.SLUG_REGEX.length;
        for (let i = 0; i < total; i ++)
        {
            input = input.replace(this.SLUG_REGEX[i].regex, this.SLUG_REGEX[i].char);
        }

        return (
            input.toLowerCase()
                .replace(/\s+/g, '-')           // Replacing spaces by dashes
                .replace(/[^a-z0-9-]/g, '')     // Deleting non alphanumeric chars
                .replace(/\-{2,}/g, '-')        // Deleting multiple dashes
                .replace(/^\-+|\-+$/g, '')		// Remove leading and trailing slashes
        );
    }


    /**
     * Will parse a query string like this :
     * test=myValue&varName=otherValue
     * to this
     * {test: 'myValue', varName: 'otherValue'}
     * No double declaration checking, no nesting, no number parsing.
     * Will start after first ? or first # if found.
     * @param queryString The query string to parse
     * @returns Associative object with parsed values
     */
    export function parseQueryString (queryString:string):ScalarObject
    {
        // Start parsing after first ? or first # if detected
        ['?', '#'].map( q =>
        {
            // Detect position of starter and split from it if detected
            const pos = queryString.indexOf( q );
            if ( pos !== -1 )
                queryString = queryString.substr( pos + 1, queryString.length );
        });

        // Convert number in strings to number
        const parseNumberValue = pValue => (
            ( StringUtils.isNumber( pValue ) )
                ? parseFloat( pValue )
                : pValue
        );

        // TODO : Ajouter le parsing de "true" / "false" ... et étendre ça a des helpers sur StringUtils

        // Split every & and browse
        const outputVarBag = {};
        queryString.split('&').map( couples =>
        {
            // Split on all =
            const splitted = couples.split('=', 2);

            // If there is an =, this is a key/value
            outputVarBag[ decodeURIComponent( splitted[0] ) ] = (
                ( splitted.length === 2 )
                // Try to parse number from strings
                ? parseNumberValue( decodeURIComponent( splitted[1] ) )
                // Otherwise, this is just a flag, we put it to true
                : true
            );
        });
        return outputVarBag;
    }

    /**
     * Check if a string represent a number, and a number only.
     * NaN and Infinity will be false.
     * @param number The string representing the number
     * @returns True if the string is representing a number.
     */
    export function isNumber (number:string):boolean
    {
        const f = parseFloat( number );
        return !isNaN( f ) && isFinite( f );
    }

    /**
     * Good old nl2br from PHP...
     * http://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript
     * @param value String in which we replace line breaks by <br> tags
     * @param breakTag <br> tag can be changed
     * @returns {string}
     */
    export function nl2br (value:string, breakTag = '<br>')
    {
        return (value + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }
}