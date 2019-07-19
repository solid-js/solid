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
     * @param {number} pTotalChars Total chars of output string (with added zeros)
     * @param {number} pNumber Base number
     * @param {number} pPlaceHolder zero char or something else ?
     * @returns {string} Zero formatted number.
     */
    export function zeroFormat (pTotalChars:number, pNumber:number, pPlaceHolder = '0'):string
    {
        // Convert number to string
        let currentNumberAsString = pNumber.toString();

        // Count chars
        let totalCharsInCurrentNumber = currentNumberAsString.length;

        // Formatted output
        let output = '';

        // If we miss some zeros
        if (totalCharsInCurrentNumber < pTotalChars)
        {
            // Add corresponding number of zeros
            const missingZeros = ( pTotalChars - totalCharsInCurrentNumber );
            for (let i = 0; i < missingZeros; i ++)
            {
                output += pPlaceHolder;
            }
        }

        // Return formatted string
        return output + currentNumberAsString;
    }

    /**
     * Add or remove the trailing slash at the end of a path.
     *
     * For ex:
     * - "/lib/test" becomes "/lib/test/" if pAdd is true
     * - "/lib/test/" becomes "/lib/test" if pAdd is false
     *
     * @param pPath String path with or without trailing slash
     * @param pAdd Will add slash or remove slash.
     * @returns patched path with or without trailing slash
     */
    export function trailingSlash (pPath:string, pAdd = true):string
    {
        // If we currently have a trailing slash
        const hasTrailingSlash = ( pPath.lastIndexOf('/') == pPath.length - 1 );

        // If we have to add trailing slash
        if (pAdd && !hasTrailingSlash)
        {
            return pPath + '/';
        }

        // If we have to remove trailing slash
        else if (!pAdd && hasTrailingSlash)
        {
            return pPath.substr(0, pPath.length - 1);
        }

        // Do nothing
        else return pPath;
    }

    /**
     * Add or remove the leading slash at the start of a path.
     *
     * For ex:
     * - "lib/test/" becomes "/lib/test/" if pAdd is true
     * - "/lib/test/" becomes "lib/test/" if pAdd is false
     *
     * @param pPath String path with or without leading slash
     * @param pAdd Will add slash or remove slash.
     * @returns patched path with or without leading slash
     */
    export function leadingSlash (pPath:string, pAdd = true):string
    {
        // If we currently have a leading slash
        const hasLeadingSlash = ( pPath.indexOf('/') == 0 );

        // If we have to add leading slash
        if (pAdd && !hasLeadingSlash)
        {
            return '/' + pPath;
        }

        // If we have to remove leading slash
        else if (!pAdd && hasLeadingSlash)
        {
            return pPath.substr(1, pPath.length);
        }

        // Do nothing
        else return pPath;
    }

    /**
     * First letter capital on given string.
     *
     * For ex: "courgette? Oui!" become "Courgette, Oui!"
     */
    export function upperCaseFirstChar (pSource:string):string
    {
        return pSource.substr(0, 1).toUpperCase() + pSource.substr(1, pSource.length);
    }

    /**
     * First letter in low case on given string.
     *
     * For ex: "Fromage? Oui!" become "fromage? Oui!"
     */
    export function lowerCaseFirstChar (pSource:string):string
    {
        return pSource.substr(0, 1).toLowerCase() + pSource.substr(1, pSource.length);
    }

    /**
     * Convert a dash case formated string to a camel case format.
     *
     * Ex: "my-string" will be converted to "myString"
     */
    export function dashToCamelCase (pSource:string, pSeparator:string = '-'):string
    {
        // Seperate dashs
        let splitted = pSource.toLowerCase().split(pSeparator);
        let total = splitted.length;

        // Return raw if it's not a dash
        if (total < 2) return pSource.toLowerCase();

        // The first is not uppercase
        let out = splitted[0];

        // Others are upper cased first
        for (let i = 1; i < total; i ++)
        {
            out += (i == 0 ? splitted[i] : StringUtils.upperCaseFirstChar(splitted[i]));
        }

        return out;
    }

    /**
     * Convert camelCase to dash_case or dash-case or DASH_CASE and event DASH-CASE
     * @param pSource camelCase string
     * @param pSeparator Used separator between words. Default is dash -
     * @param pUpperCase If we have to uppercase every words. Default is no thanks.
     * @returns {string} dash-case-string or dash_case_string
     */
    export function camelToDashCase (pSource:string, pSeparator = '-', pUpperCase = false):string
    {
        return pSource.replace(
            /([A-Z])/g,
            ( part:string ) => (
                pSeparator
                + (
                    pUpperCase
                        ? part.toUpperCase()
                        : part.toLowerCase()
                )
            )
        );
    }

    /**
     * Convertir un enum en string, camelCase ou dash-case.
     * Va convertir un EMonEnum.MA_VALEUR en "maValeur" ou "ma-valeur"
     * @param pEnumValue La valeur de l'enum ( EMonEnum.MA_VALEUR )
     * @param pEnumClass La classe de l'enum ( EMonEnum )
     * @param pCamelCase si true on ressort "maValeur" si false on ressort "ma-valeur"
     * @returns {string} Le nom en camelCase ou dash-case
     */
    export function enumToString (pEnumValue:number, pEnumClass:Object, pCamelCase = true):string
    {
        // On récupère le string en underscore depuis notre enum
        let enumStringValue = pEnumClass[pEnumValue] as string;

        // On converti en dashCase
        let enumDashValue = enumStringValue.toLowerCase().split('_').join('-');

        // On retourne en camel ou en dash
        return pCamelCase ? StringUtils.dashToCamelCase(enumDashValue) : enumDashValue;
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
    export function getFileFromPath (pPath:string):string
    {
        let lastIndex = pPath.lastIndexOf('/');

        if (lastIndex == -1)
        {
            lastIndex = 0;
        }

        return pPath.substring(lastIndex + 1, pPath.length);
    }

    /**
     * Get the base folder from any path.
     * Will include trailing slash.
     * Will return full string if no slash found.
     * ex: 'usr/bin/TestFile' will return 'usr/bin/'
     */
    export function getBaseFromPath (pPath:string):string
    {
        let lastIndex = pPath.lastIndexOf('/');

        if (lastIndex == -1)
        {
            lastIndex = pPath.length;
        }

        return pPath.substring(0, lastIndex);
    }

    /**
     * Get the local path from a full path and a base.
     * For ex : will extract /dir/file.html from /my/base/dir/file.html with base /my/base
     * To work, pBase have to be the exact beginning of pPath. This is to avoid issues with bases like '/'
     * If base is invalid, pPath will be returned.
     * No error thrown.
     * If you want starting slash or not, please use StringUtils.trailingSlash method on pPath and / or pBase
     */
    export function extractPathFromBase (pPath:string, pBase:string):string
    {
        // Get the index of base within the path
        let baseStartIndex = pPath.indexOf( pBase );

        return (
            // Base is starting path so its ok
            baseStartIndex == 0
                ? pPath.substr( pBase.length, pPath.length )
                // Invalid base for this path, do nothing
                : pPath
        );
    }

    /**
     * Micro template engine using regex and mustache like notation
     * @param pTemplate Base mustache like template (ex: "Hey {{userName}} !")
     * @param pValues List of replaces values (ex : {userName: "You"})
     * @returns the computed template with values (ex : "Hey You !")
     */
    export function quickMustache (pTemplate:string, pValues:{}):string
    {
        return pTemplate.replace(/\{\{(.*?)\}\}/g, function(i, pMatch) {
            return pValues[pMatch];
        });
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
    export function slugify (pInput:string):string
    {
        // Replace all non URL compatible chars
        const total = this.SLUG_REGEX.length;
        for (let i = 0; i < total; i ++)
        {
            pInput = pInput.replace(this.SLUG_REGEX[i].regex, this.SLUG_REGEX[i].char);
        }

        // Patch quircks
        return (
            pInput.toLowerCase()
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
     * @param pQueryString The query string to parse
     * @returns Associative object with parsed values
     */
    export function parseQueryString (pQueryString:string):{[key:string]:string|number|boolean}
    {
        // Start parsing after first ? or first # if detected
        ['?', '#'].map( q =>
        {
            // Detect position of starter and split from it if detected
            const pos = pQueryString.indexOf( q );
            if ( pos !== -1 )
                pQueryString = pQueryString.substr( pos + 1, pQueryString.length );
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
        pQueryString.split('&').map( couples =>
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
     * @param pNumberAsString The string representing the number
     * @returns True if the string is representing a number.
     */
    export function isNumber (pNumberAsString:string):boolean
    {
        const f = parseFloat( pNumberAsString );
        return !isNaN( f ) && isFinite( f );
    }

    /**
     * Good old nl2br from PHP...
     * http://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript
     * @param str String in which we replace line breaks by <br> tags
     * @param breakTag <br> tag can be changed
     * @returns {string}
     */
    export function nl2br (str:string, breakTag = '<br>')
    {
        return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    }
}