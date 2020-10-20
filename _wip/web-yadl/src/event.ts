
// TODO DOC


import {type} from "os";

// I had to made two type so Typescript is not angry.
type MultiEventName = (keyof HTMLElementEventMap)[];
type SingleEventName = keyof HTMLElementEventMap;

// TODO : if possible, real event type
export type EventHandler = (event:Event) => any|void

// TODO DOC
export function wire ( element:HTMLElement, events:SingleEventName|MultiEventName, connect:boolean, handler:EventHandler )
{
    // Connect or disconnect an event on element
    const subWire = ( eventName ) => (
        connect
        ? element.addEventListener( eventName, handler )
        : element.removeEventListener( eventName, handler )
    );

    // Connect one or several events
    Array.isArray( events ) ? events.map( subWire ) : subWire( events as string );
}


// TODO DOC
export function onceEvent ( element:HTMLElement, events:SingleEventName|MultiEventName, handler:EventHandler ):() => void
{
    // One proxy for all events to be able to remove it by reference
    function proxy ( event:Event )
    {
        // When any event fired, remove all events
        wire( element, events, false, proxy );

        // Call handler and pass event
        return handler( event );
    }

    // Wire all events on this element
    wire( element, events, true, proxy );

    // Returns a function which kills all events listeners if called
    return () => wire( element, events, false, proxy );
}

// TODO : Ecoute d'event à la JQuery, avec un selecteur
// TODO : Faire la version sans selecteur, avec la même fonction ou non, le plus simple

/*
export function on ( root:HTMLElement, selector:string, events:MultiOrSingleEventName, handler:EventHandler ):() => void
{


    //return () => wire( false );
}
*/