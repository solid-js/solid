


export function append ( element:HTMLElement, container:HTMLElement|Document = document.body)
{
    container.appendChild( element );
}

export function remove ( element:HTMLElement )
{
    element.parentElement && element.parentElement.removeChild( element );
}