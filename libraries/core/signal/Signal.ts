
// ----------------------------------------------------------------------------- STRUCT

/**
 * Describes a Signal handler type.
 */
type THandler<GArguments extends any[]> = (...rest:GArguments) => any

/**
 * Interface describing a internal listener.
 */
interface IListener<GArguments extends any[]>
{
	scope		:object;
	handler		:THandler<GArguments>
	once		:boolean;
}

/**
 * Default arguments generics is optionnal type (array of any)
 */
export class Signal <GArguments extends any[] = any[]>
{
	// ------------------------------------------------------------------------- LOCALS

	// All registered listeners
	protected _listeners				:IListener<GArguments>[]	= [];


	// ------------------------------------------------------------------------- GETTERS

	// Get total attached listeners
	get length ():number { return this._listeners.length; }


	// ------------------------------------------------------------------------- ADDING / LISTENING

	/**
	 * TODO DOC
	 * - TODO Interdire bind
	 * - TODO scope optionnel
	 *
	 * Add a listener. The handler will be called each time dispatch is called.
	 * The handler will get the dispatch parameters.
	 * Will return the id of the listening, for removing later.
	 * @param scopeOrHandler Called when signal is dispatched.
	 * @param handlerIfScope Scope to apply to handler. Let null to keep default.
	 * @param andCall
	 * @returns {number} The register index, to remove easily.
	 */
	add ( scopeOrHandler:THandler<GArguments>|object, handlerIfScope?: THandler<GArguments>, andCall:GArguments[] = null ):void
	{
		arguments.length == 1
		? this.register( scopeOrHandler as THandler<GArguments>, null, false, andCall )
		: this.register( handlerIfScope, scopeOrHandler as object, false, andCall );
	}

	/**
	 * TODO DOC
	 * Same as add, but will be removed when dispatched once.
	 * @param scopeOrHandler Called when signal is dispatched.
	 * @param handlerIfScope Scope to apply to handler. Let null to keep default.
	 */
	addOnce ( scopeOrHandler:THandler<GArguments>|object, handlerIfScope?: THandler<GArguments> ):void
	{
		arguments.length == 1
		? this.register( scopeOrHandler as THandler<GArguments>, null, true )
		: this.register( handlerIfScope, scopeOrHandler as object, true );
	}

	/**
	 * Register a listener.
	 */
	protected register ( handler:THandler<GArguments>, scope:object, once:boolean, andCall:GArguments[] = null ):void
	{
		// Store this listener with its scope
		this._listeners.push({ handler, scope, once });

		// Call handler with scope directly if we have arguments
		andCall && handler.apply( scope, andCall );
	}


	// ------------------------------------------------------------------------- DISPATCHING

	/**
	 * Dispatch the signal to all listeners. Will call all registered listeners with passed arguments.
	 * Will return the list of listeners returns (listeners not returning anythings will be ignored)
	 */
	dispatch (...rest:GArguments):any[]
	{
		const listenersToRemove	:IListener<GArguments>[] = [];
		const results = this._listeners.filter( currentListener =>
		{
			// Call the listener
			const currentResult = currentListener.handler.apply( currentListener.scope, rest );

			// If it's an once listener, mark as remove
			currentListener.once
			&&
			listenersToRemove.push(currentListener);

			// If we have result, add it to the return package
			return currentResult != null;
		});

		// Remove all once listeners
		const total = listenersToRemove.length;
		for ( let listenerIndex = 0; listenerIndex < total; listenerIndex ++ )
		{
			this.remove( listenersToRemove[ listenerIndex ].handler );
		}

		// Return the result package of all listeners
		return results;
	}


	// ------------------------------------------------------------------------- REMOVING & DESTRUCT

	/**
	 * TODO : DOC
	 * Remove a listener by its id (returned by the add method) or by its handler reference.
	 * Will return true if the listener is found and removed.
	 */
	remove ( scopeOrHandler:THandler<GArguments>|any, handlerIfScope?: THandler<GArguments> ):void
	{
		// Get scope and handler depending on arguments order
		let scope:any;
		let handler:THandler<GArguments>;
		if ( arguments.length == 1 )
		{
			scope = null;
			handler = scopeOrHandler;
		}
		else
		{
			scope = scopeOrHandler;
			handler = handlerIfScope;
		}

		// New set of listeners
		let newListeners:IListener<GArguments>[] = [];

		// Browse all listeners
		const total = this._listeners.length;
		for ( let listenerIndex = 0; listenerIndex < total; listenerIndex ++ )
		{
			// Target current listener
			const currentListener = this._listeners[ listenerIndex ];

			// If this listener has the handler we want to removed
			if ( currentListener.handler == handler )
			{
				// If there is no scope,
				// remove this listener by not adding it to the new list
				if ( scope == null ) continue;

				// If there is a scope,
				// only remove it if this is the same scope
				else if ( currentListener.scope == scope ) continue;
			}

			// This listener has not been removed, add it to the new set
			newListeners.push( currentListener );
		}

		// Do not include this code in production
		if ( process.env.NODE_ENV != 'production' )
		{
			const handlerSignature = handler.name || handler.toString();

			// Throw error if handler has not been found and deleted.
			if ( newListeners.length == this._listeners.length )
			{
				throw new Error(`Signal // Handler ${handlerSignature} has not been removed. Set scope if needed and avoid adding binded functions.`);
			}
			// Throw error if more than one handler has been deleted
			else if ( newListeners.length < this._listeners.length - 1 )
			{
				throw new Error(`Signal // Handler ${handlerSignature} has not been removed. Set scope if needed and avoid adding binded functions.`);
			}
		}

		// Remap new listeners
		this._listeners = newListeners;
	}

	/**
	 * Remove all listeners
	 */
	clear ():void
	{
		this._listeners = [];
	}

	/**
	 * Destroy this signal and every registered handler.
	 */
	dispose ():void
	{
		delete this._listeners;
	}
}