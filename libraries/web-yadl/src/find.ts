
// TODO DOC
export type ContainerOrElementsOrSelector = string|Element|Element[];

export type ElementHandler<GReturnType> = ( handler?:(element:Element) => GReturnType ) => GReturnType;

export type FindReturnType = {
    [key:number] : Element
    first	: ElementHandler<Element|any|void>
    all		: ElementHandler<Element[]|any[]|void>
}

/**
 * TODO DOC
 * @param containerOrSelector
 * @param selector
 */
export function find (containerOrSelector: ContainerOrElementsOrSelector, selector?: string): FindReturnType
{
    // Check if container is an array of element
    // Throw if we got incompatible arguments (like list of elements and selector)
    const containerIsArray = Array.isArray(containerOrSelector);
    if (containerIsArray && selector != null)
        throw new Error(`YADL.find // Cannot have multiple elements as container, and cannot have a selector when targeting multiple elements.`);

    // Target container as first argument and create elements list
    let container: Element | Document = containerOrSelector as Element;
    let list: Element[] = [];

    // Directly convert if we have a list of elements as arguments
    if (containerIsArray) {
        list = containerOrSelector as Element[];
    }
    // Set container as document and get selector from arguments if there is no selector argument
    else if (selector == null) {
        selector = containerOrSelector as string;
        container = document;
    }

    // Target selector from element container and convert NodeList to static list
    container.querySelectorAll(selector).forEach((node, i) => list[i] = node);

    // Return list of elements
    return {
        // Add all found elements as list
        ...list,
        // Get first element through an handler
        first: handler => handler ? handler(list[0]) : list[0],
        // Loop through all elements through an handler
        all: handler => handler ? list.map(el => handler(el)) : list
    };
}