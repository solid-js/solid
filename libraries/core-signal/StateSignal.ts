import { Signal } from './Signal';
const shallowEqual = require('shallow-equal/objects');


export class StateSignal <GState> extends Signal <[GState]>
{
	// Current state
	protected _state:GState;

	/**
	 * Get current state.
	 */
	get state ():GState { return this._state; }

	/**
	 * Constructor
	 * @param state Init this StateSignal with a state.
	 */
	constructor ( state ?: GState )
	{
		super();
		this._state = state;
	}

	/**
	 * Dispatch a new state to every listeners
	 */
	dispatch ( state:GState, force = false )
	{
		// Shallow equals incoming state with current state
		// Do not update if state seems to be the same
		if ( !force && shallowEqual(state, this._state) ) return null;

		// Store state
		this._state = state;

		// Dispatch state
		return super.dispatch( state );
	}

	/**
	 * Destroy this signal and every registered handler.
	 */
	dispose ()
	{
		super.dispose();
		delete this._state;
	}
}