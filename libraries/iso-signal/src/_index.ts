
// ----------------------------------------------------------------------------- STRUCT

// Type of a micro signal handler
export type TSignalHandler <G = void|any, E = void|any> = (param:G) => E

// Default interface of a micro signal
export interface ISignal <G = void|any, E = void|any>
{
	on: ( handler:TSignalHandler<G, E> ) => () => void
	off: ( handler:TSignalHandler<G, E> ) => void
	dispatch: ( param:G ) => E[]
	clear: () => void
	readonly listeners : TSignalHandler<G, E>[]
	readonly state: G;
}

// ----------------------------------------------------------------------------- MIX SIGNAL & STATE SIGNAL

export function Signal<G = void | any, E = void | any>(
	_state: G = null,
): ISignal<G, E> {
	let _listeners = [];
	const off = (handler) => _listeners.filter((s) => s != handler);
	return {
		on(handler: TSignalHandler<G>) {
			_listeners.push(handler);
			return () => off(handler);
		},
		off,
		dispatch: (param: G) => {
			_state = param;
			return _listeners.map((h) => h(param))
		},
		clear() { _listeners = []  },
		get listeners() { return _listeners },
		get state(): G { return _state; }
	};
}

