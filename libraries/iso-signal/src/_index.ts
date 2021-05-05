
// ----------------------------------------------------------------------------- STRUCT

// Type of a signal handler
export type TSignalHandler <GHP extends any[], GHR = void|any> = ( ...rest:GHP) => GHR

export interface ISignal <GHP extends any[] = any[], GHR = void|any>
{
	on: ( handler:TSignalHandler<GHP, GHR> ) => () => void
	off: ( handler:TSignalHandler<GHP, GHR> ) => void
	dispatch: ( ...rest:GHP ) => GHR[]
	clear: () => void
	readonly listeners: TSignalHandler<GHP, GHR>[]
}

export interface IStateSignal <GHP extends any = any, GHR = void|any> extends ISignal<[GHP], GHR>
{
	dispatch: ( state:GHP ) => GHR[]
	readonly state:GHP
}

// ----------------------------------------------------------------------------- CLASSIC SIGNAL

export function Signal
	<GHP extends any[] = any[], GHR = void|any>
	():ISignal<GHP, GHR>
{
	let _listeners = []
	const off = ( handler ) => _listeners = _listeners.filter( l => l != handler )
	return {
		on ( handler ) {
			_listeners.push( handler )
			return () => off( handler )
		},
		off,
		dispatch: ( ...rest ) => _listeners.map( l => l(...rest) ),
		clear () { _listeners = [] },
		get listeners () { return _listeners }
	}
}

// ----------------------------------------------------------------------------- STATE SIGNAL

export function StateSignal
	<GHP extends any = any[], GHR = void|any>
	( _state:GHP = null, _signal = Signal<[GHP], GHR>() )
	:IStateSignal<GHP, GHR>
{
	return {
		..._signal,
		dispatch ( state ) {
			_state = state;
			return _signal.dispatch( state )
		},
		get state () { return _state }
	}
}
