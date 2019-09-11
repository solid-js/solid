import {onceEvent} from "./event";


export async function ready ()
{
    return new Promise( resolve =>
    {
        if ( document.readyState !== 'loading' ) resolve();
        else document.addEventListener('DOMContentLoaded', resolve);
    });
}

/**
 * @see https://www.w3schools.com/jsref/event_onload.asp
 * @param element
 */
export async function loaded ( element:HTMLElement = document.body )
{
    return new Promise ( (resolve, reject) =>
    {
        if ( 'complete' in element && element['complete'] ) return resolve();

        onceEvent(element, ['load', 'error'], event => {
            event.type === 'load' ? resolve() : reject();
        });
    });
}