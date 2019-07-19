import { Signal } from "./Signal";

/**
 * Abstract interface describing an event dispatcher.
 * Is not using lib.d.ts's EventDispatcher to avoid dependencies to those @types
 * inside Node only envs.
 */
interface TEventDispatcherLike <GEvent>
{
	addEventListener( type:string, handler?:(event:GEvent, ...rest) => any, ...rest )
	removeEventListener( type:string, handler?:(event:GEvent, ...rest) => any )

	// NOTE : Dispatch first argument's type is from GArguments array
	dispatch( type:string, event:GEvent )
}


export class EventSignal <GEvent> extends Signal <[GEvent]>
{
	// Dispatcher if from an EventDispatcher
	protected _fromDispatcher			:TEventDispatcherLike<GEvent>;

	// Event names if from an EventDispatcher
	protected _fromEvents				:string[];

	/**
	 * TODO
	 */
	constructor ( fromDispatcher?:TEventDispatcherLike<GEvent>, fromEvents?:string[], ...rest )
	{
		super();

		// Do not continue if this is not an EventDispatcher
		if ( this._fromDispatcher == null || this._fromEvents == null ) return;

		// Store EventDispatcher and event names to be able to dispose later
		this._fromDispatcher = fromDispatcher;
		this._fromEvents = fromEvents;

		// Map every event on this EventDispatcher
		// add ...rest as last parameters ( for {passive: true} for example )
		this._fromEvents.map(
			event => this._fromDispatcher.addEventListener( event, this.dispatcherEventHandler, ...rest )
		);
	}

	/**
	 * Dispatch signal from EventDispatcher
	 */
	protected dispatcherEventHandler ( event:GEvent, ...rest )
	{
		super.dispatch.call(this, event, ...rest);
	}

	/**
	 * Disabled method.
	 * EventSignal can only dispatch from attached EventDispatcher.
	 */
	dispatch ():any[]
	{
		// Do not include this code in production
		if ( process.env.NODE_ENV != 'production' )
		{
			throw new Error(`Signal // EventSignal can only dispatch from attached EventDispatcher.`);
		}
		return null;
	}

	/**
	 * Destroy this signal and every registered handler.
	 */
	dispose ()
	{
		super.dispose();

		// Remove everything which is EventDispatcher related
		if (this._fromDispatcher == null) return;

		// Detach all events from EventDispatcher
		this._fromEvents.map(
			event => this._fromDispatcher.removeEventListener( event, this.dispatcherEventHandler )
		);

		delete this._fromDispatcher;
		delete this._fromEvents;
	}
}