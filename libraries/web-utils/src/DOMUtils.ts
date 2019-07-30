// TODO -> Virer ou Remplacer JQuery par un yadl
// http://youmightnotneedjquery.com/


/**
 * The name of the silly greensock injected var
 */
const GS_TRANSFORM_KEY = '_gsTransform';


namespace DOMUtils
{
    /**
     * Get a position value transformed by Greensock.
     * Ex X or Y while a transition on a any object.
     */
    export function getGreensockValue (target:any):number
    {
        // No target
        if ( target == null )
            return null;

        // Transform key available
        else if (GS_TRANSFORM_KEY in target)
            return target[GS_TRANSFORM_KEY];

        // Transform key available in first child (jQuery / zepto)
        else if ( (0 in target) && GS_TRANSFORM_KEY in target[0] )
            return target[0][GS_TRANSFORM_KEY];

        // Oops
        else return null;
    }

    /**
     * Get size of scrollbar following client env.
     * Warning hazardous code !
     * @returns the default size of a vertical scrollbar
     */
    export function getScrollBarSize ():number
    {
        // Create temp scrollable div
        let $scrollableDiv = $('<div></div>').addClass('verticalScroll').css({
            position: 'absolute',
            width: 100,
            height: 100,
            overflow: 'scroll',
            top: -9999
        });

        // Append it to body
        $scrollableDiv.appendTo( $('body') );

        // Measure inner and outer size
        let scrollBarWidth = $scrollableDiv[0].offsetWidth - $scrollableDiv[0].clientWidth;

        // Remove from dom
        $scrollableDiv.remove();

        // Return measured size and pray
        return scrollBarWidth;
    }

    /**
     * Measure the size pixel value of an element with a dynamic size.
     * Width and height only can be measured in px. No background positions.
     * Dynamic sizes can be things like 'auto', '50%', '3em', '3vw'
     * @param pElement The DOM element to measure.
     * @param pPropertyName width or height only
     * @param pDynamicSize Dynamic size to measure. 'auto', '50%', '3em', '3vw' ...
     * @throws Error if pPropertyName is not valid.
     * @returns {number} Measured size in px.
     */
    export function getPixelSizeFromDynamicSize (pElement:HTMLElement, pPropertyName = 'height', pDynamicSize: 'auto'):number
    {
        // Check property name
        if (pPropertyName != 'width' && pPropertyName != 'height')
        {
            throw new Error(`DOMUtils.getPixelSizeFromDynamicSize // Only width and height are valid size properties.`);
        }

        // Target element as a jquery / zepto collection
        const $element = $( pElement );

        // Get current declared css value
        const currentValue = $element.css( pPropertyName );

        // Set dynamic value to measure
        $element.css(pPropertyName, pDynamicSize);

        // Measure size in px
        const pixelValue = $element[ pPropertyName ]();

        // Roll back to the first measured height value
        $element.css(pPropertyName, currentValue);

        // Return measured value
        return pixelValue;
    }

    /**
     * Get number value from a css property.
     * Will return an array with the number parsed value and the unit.
     * Can parse % and px values.
     * Will return [0, null] in case of error.
     * Exemple : cssToNumber("35px") -> [35, "px"]
     * @param pValue The returned value from css
     * @return First value is the number value, second index is the unit ("px" or "%")
     */
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

    /**
     * Get scaled value of any DOM element even if scale is modified by a parent.
     * @param pElement The element to check
     * @returns {[number,number]} Will return an array with width and height values.
     */
    export function getGlobalScale (pElement:HTMLElement):number[]
    {
        return [
            pElement.getBoundingClientRect().width / pElement['offsetWidth'],
            pElement.getBoundingClientRect().height / pElement['offsetHeight']
        ];
    }

    /**
     * Will return nearest parent element corresponding to selector.
     * @param pTarget The element to check.
     * @param pSelector Selector on which target or parent we have to check.
     * @returns target or any of its parents correspond to the selector
     */
    export function nearestParent (pTarget:HTMLElement, pSelector:string):HTMLElement
    {
        return (
            $( pTarget ).is( pSelector )
            ? pTarget
            : $( pTarget ).parents( pSelector ).get(0)
        );
    }
}