
// TODO DOC
export type StyleScalarValue = string|number|null
export type StyleFunctionalValue = ( element:HTMLElement, style:StyleObject ) => StyleScalarValue
export type StyleObject = Partial<Record <keyof CSSStyleDeclaration, StyleScalarValue | StyleFunctionalValue>>;

// TODO : Trouver mieux que ça depuis stdlib
// TODO : DOC
export type AttributeList = {[key:string]:any};

/**
 * TODO DOC
 * @param element
 * @param style
 */
export function style ( element:HTMLElement, style:StyleObject )
{
    if ( !('style' in element) ) return;
    Object.keys(style).map( property =>
    {
        let value;
        switch ( typeof style[ property ] ) {
            case "string" :
                value = style[ property ]; break;
            case "number" :
                value = style[ property ] + 'px'; break;
            case "function":
                value = style[ property ]( element, style ); break;
        }
        element.style[ property ] = value;
    });
}

/**
 * TODO : DOC
 * @param element
 * @param attributes
 */
export function setAttributes ( element:HTMLElement, attributes:AttributeList )
{
    Object.keys( attributes ).map( key =>
    {
        let value = attributes[ key ];

        // Convert booleans to empty strings
        if ( value === true || value === '' )
            value = '';
        else if ( value === false || value === null )
            return;

        // TODO : D'autres conversions ?

        element.setAttribute( key, value );
    });
}

/**
 * TODO DOC
 * @param htmlOrTagName
 * @param attributes
 * @param styleProperties
 */
export function create (htmlOrTagName:string, attributes?:AttributeList, styleProperties?:StyleObject)
{
    // Create from tag name if there are no XML tags
    let element:HTMLElement;
    if ( htmlOrTagName.indexOf('<') === -1 )
        element = document.createElement(htmlOrTagName);

    // Create container and inject html if there are XML tags
    else
    {
        const el = document.createElement('div');
        el.innerHTML = htmlOrTagName;
        element = el.firstElementChild as HTMLElement;
    }

    // Add all attributes
    attributes && setAttributes( element, attributes );

    // Add style properties
    styleProperties && style( element, styleProperties );

    return element;
}