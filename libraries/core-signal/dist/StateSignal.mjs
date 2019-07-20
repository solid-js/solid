import { Signal } from './Signal';
const shallowEqual = require('shallow-equal/objects');
export class StateSignal extends Signal {
    /**
     * Constructor
     * @param state Init this StateSignal with a state.
     */
    constructor(state) {
        super();
        this._state = state;
    }
    /**
     * Get current state.
     */
    get state() { return this._state; }
    /**
     * Dispatch a new state to every listeners
     */
    dispatch(state, force = false) {
        // Shallow equals incoming state with current state
        // Do not update if state seems to be the same
        if (!force && shallowEqual(state, this._state))
            return null;
        // Store state
        this._state = state;
        // Dispatch state
        return super.dispatch(state);
    }
    /**
     * Destroy this signal and every registered handler.
     */
    dispose() {
        super.dispose();
        delete this._state;
    }
}
