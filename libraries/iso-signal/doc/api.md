# Signal API


### Constructor

To create a new Signal

`new Signal()`

---

If you are using Typescript, dispatched arguments types can be specified with a Generic :

`new Signal<ArgumentTypes>()`

?> Know more about [Signal typings](guide/5-typings.md).

### Properties

Total attached listeners to this Signal :

`length`


### Methods

Attach a listener to a Signal. Handler will be called each time the Signal is dispatched.

`add( listener:(...rest) => any )`

`add( scope:object, listener:(...rest) => any )`

`add( scope:object, listener:(...rest) => any, callArguments:any[] )`

- Will [add and call](guide/6-add-and-call.md) handler in one line.

?> See [handlers documentation](guide/4-handlers.md) to avoid pitfalls.

---

Attach a listener that will be automatically detached after the first dispatch :

`addOnce( listener:(...rest) => any )`

`addOnce( scope:object, listener:(...rest) => any )`

---

Call every attached listener with optionnal arguments

`dispatch( ...rest )`

---

Detach a specific handler.

`remove( listener:(...rest) => any )`
- Will remove an attached listener which was added __without a scope__.

`remove( scope:object, listener:(...rest) => any )`
- Will remove an attached listener which was added __with a scope__.

!> Will throw errors in dev mode if listener is not found.

---

Detach every listeners ( but keep the Signal working ).

`clear()`

---

Detach every listeners and destroy the Signal, __it will be unusable__.

`dispose()`

?> See [documentation about Signal destruction](guide/3-destruction.md).