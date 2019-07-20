import { Signal } from "./Signal";
export class EventSignal extends Signal {
    /**
     * TODO
     */
    constructor(fromDispatcher, fromEvents, ...rest) {
        super();
        // Do not continue if this is not an EventDispatcher
        if (this._fromDispatcher == null || this._fromEvents == null)
            return;
        // Store EventDispatcher and event names to be able to dispose later
        this._fromDispatcher = fromDispatcher;
        this._fromEvents = fromEvents;
        // Map every event on this EventDispatcher
        // add ...rest as last parameters ( for {passive: true} for example )
        this._fromEvents.map(event => this._fromDispatcher.addEventListener(event, this.dispatcherEventHandler, ...rest));
    }
    /**
     * Dispatch signal from EventDispatcher
     */
    dispatcherEventHandler(event, ...rest) {
        super.dispatch.call(this, event, ...rest);
    }
    /**
     * Disabled method.
     * EventSignal can only dispatch from attached EventDispatcher.
     */
    dispatch() {
        // Do not include this code in production
        if (process.env.NODE_ENV != 'production') {
            throw new Error(`Signal // EventSignal can only dispatch from attached EventDispatcher.`);
        }
        return null;
    }
    /**
     * Destroy this signal and every registered handler.
     */
    dispose() {
        super.dispose();
        // Remove everything which is EventDispatcher related
        if (this._fromDispatcher == null)
            return;
        // Detach all events from EventDispatcher
        this._fromEvents.map(event => this._fromDispatcher.removeEventListener(event, this.dispatcherEventHandler));
        delete this._fromDispatcher;
        delete this._fromEvents;
    }
}
