import {create, style} from "./element";
import {append, remove} from "./tree";


/**
 * Get size of scrollbar following client env.
 * Warning hazardous code !
 * @returns the default size of a vertical scrollbar
 */
export function getScrollBarSize ():number
{
    const $scrollableDiv = create('div', {
        overflow: 'hidden',
        overflowY: 'visible',
        position: 'absolute',
        width: 100,
        height: 100,
        top: -9999
    });

    // Measure inner and outer size
    append( $scrollableDiv );
    const scrollBarWidth = $scrollableDiv[0].offsetWidth - $scrollableDiv[0].clientWidth;
    remove( $scrollableDiv );

    // Return measured size and pray
    return scrollBarWidth;
}


/**
 * TODO : Utiliser ça : ('45 px'.match(/[a-zA-Z]/) || []).pop();
 *
 * Get number value from a css property.
 * Will return an array with the number parsed value and the unit.
 * Can parse % and px values.
 * Will return [0, null] in case of error.
 * Exemple : cssToNumber("35px") -> [35, "px"]
 * @param pValue The returned value from css
 * @return First value is the number value, second index is the unit ("px" or "%")
 */
/*
export function cssToNumber (pValue:string):any[]
{
    // Chercher l'unité "px"
    let indexToCut = pValue.indexOf("px");

    // Chercher l'unité "%""
    if (indexToCut == -1)
    {
        indexToCut = pValue.indexOf("%");
    }

    // Résultat
    return (
        // Si on n'a pas trouvé l'unité
        indexToCut == -1

            // On ne peut pas retourner
            ? [
                parseFloat(pValue),
                null
            ]

            // Séparer la valeur de l'unité
            : [
                parseFloat(pValue.substr(0, indexToCut)),
                pValue.substr(indexToCut, pValue.length).toLowerCase()
            ]
    )
}
*/

/**
 * Get scaled value of any DOM element even if scale is modified by a parent.
 * @param pElement The element to check
 * @returns {[number,number]} Will return an array with width and height values.
 */
export function getGlobalScale ( pElement:HTMLElement ):number[]
{
    return [
        pElement.getBoundingClientRect().width / pElement['offsetWidth'],
        pElement.getBoundingClientRect().height / pElement['offsetHeight']
    ];
}