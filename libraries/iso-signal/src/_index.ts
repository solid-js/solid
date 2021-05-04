
// ----------------------------------------------------------------------------- STRUCT

// Type of a micro signal handler
export type TSignalHandler <G extends any[], E = void|any> = (...rest:G) => E

// Default interface of a micro signal
export interface ISignal <G extends any[] = any[], E = void|any>
{
	on: ( handler:TSignalHandler<G, E> ) => () => void
	off: ( handler:TSignalHandler<G, E> ) => void
	dispatch: ( ...rest:G ) => E[]
	clear: () => void
	readonly listeners : TSignalHandler<G, E>[]
}

// Extended interface of a state signal
export interface IStateSignal <G extends any = any, E = void|any> extends ISignal<[G], E>
{
	dispatch: ( state:G ) => E[]
	readonly state : G
}

// ----------------------------------------------------------------------------- CLASSIC SIGNAL

export function Signal <G extends any[] = any, E = void|any> ():ISignal<G, E> {
	let _listeners = []
	const off = ( handler ) => _listeners.filter( s => s != handler )
	return {
		on ( handler:TSignalHandler<G> ) {
			_listeners.push( handler )
			return () => off( handler )
		},
		off,
		dispatch: ( ...rest:G ) => _listeners.map( h => h(...rest) ),
		clear () { _listeners = [] },
		get listeners () { return _listeners }
	}
}

// ----------------------------------------------------------------------------- STATE SIGNAL

export function StateSignal
	<G extends any, E = void|any>
	( _state:G = null, _signal = Signal<[G], E>() )
	:IStateSignal<G, E>
{
	return {
		..._signal,
		dispatch ( state:G ) {
			_state = state;
			return _signal.dispatch( state )
		},
		get state ():G { return _state }
	}
}
