
// TODO DOC
export type StyleScalarValue = string|number|null
export type StyleFunctionalValue = ( element:HTMLElement, style:StyleObject ) => StyleScalarValue
export type StyleObject = Partial<Record <keyof CSSStyleDeclaration, StyleScalarValue | StyleFunctionalValue>>;

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
 * TODO DOC
 * @param htmlOrTagName
 * @param styleProperties
 */
export function create (htmlOrTagName:string, styleProperties?:StyleObject)
{
    let element:HTMLElement;

    if ( htmlOrTagName.indexOf('<') === -1 )
        element = document.createElement(htmlOrTagName);
    else
    {
        const el = document.createElement('div');
        el.innerHTML = htmlOrTagName;
        element = el.firstElementChild as HTMLElement;
    }

    styleProperties && style(element, styleProperties);

    return element;
}