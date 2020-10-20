![solid-js](../../doc/media/solid-js.png)

# Signal event system

> Signal is an object based event system.


### Concept

Classic events dispatcher systems are __string based__, which can be difficult to track across your application.

```javascript
document.addEventListener( "which one already ?" );
```

With Signal, every "event" is represented by an __object__ with `add` and `dispatch` methods.
<br>Messages can be dispatched and followed __more fluently__ thanks to its object notation.

```javascript
const onModelReady = new Signal()

onModelReady.add( function ( state ) {
	console.log('Model ready state changed', state.ready) // true
})

onModelReady.dispatch({
	ready: true
})
```

### Install

`npm i -S @solid-js/signal`

### Size

__TODO__

### Dependencies

__TODO__

### History

This library comes from [Robert Penner's AS3 Signal](https://github.com/robertpenner/as3-signals).
This is not a port, it has been entirely remade for Typescript and Javascript.


### Works well with classes

Signal can work inside a __functionnal workflow__, as well as in a __object oriented paradygm__.
Here is an example of Signals implements to create clear communication flow between objects.

```javascript
class UserModel
{
	readonly onReady            = new Signal();
	readonly onUserConnected    = new Signal();
	readonly onMessageReceived  = new Signal();

	[...]

	userConnectedHandler ( rawUserData )
	{
		const user = new User( rawUserData );
		this.onUserConnected.dispatch( user );
	}
}

class UserView
{
	constructor ( userModel )
	{
		userModel.onUserConnected.add( this, this.userConnectedHandler )
	}

	[...]

	userConnectedHandler ( user )
	{
		console.log( user );
	}
}
```

### Typescript

This library comes with __Typescript definitions__. Source code is pre-compiled to Javascript modules so Typescript is __opt-in and up to you__.
Signals can have [static types set](guide/5-typings.md) to help error checking in your project.

### More ...


Event Signal __TODO__
State Signal __TODO__


### Solid-js

__TODO__
