# Handlers

To avoid memory leaks with classes, we have to follow some basic rules about handlers.

!> __Problem__, keeping the `this` in handlers.

```javascript
class MyClass
{
	readonly onWindowResized = new Signal()

	constructor ()
	{
		// Without adding scope as first argument
		this.onWindowResized.add( this.myHandler )
	}

	myHandler ()
	{
		// "this" will be "lost"
		console.log( this ) // undefined
	}
}
```

!> __Problem__, binded functions are not removable.

If you decide to bind a Signal's handler to have access to `this`, you will lost the ability to remove this handler later, and my create a memory leak :

```javascript
class MyClass
{
	readonly onWindowResized = new Signal()

	constructor ()
	{
		// NOT GOOD
		this.onWindowResized.add( this.myHandler.bind(this) )

		// ALSO NOT GOOD
		this.onWindowResized.add( () => this.myHandler )
	}

	myHandler ()
	{
		// We have "this", but ...
		console.log( this )
	}

	removeListener ()
	{
		// Unable to target which handler to remove
		// WILL NOT WORK
		this.onWindowResize.remove( this.myHandler.bind(this) )
		this.onWindowResize.remove( () => this.myHandler )
		this.onWindowResize.remove( this.myHandler )
	}
}
```

__NOTE :__ The last 3 `remove` will throw some Errors in dev mode, and do nothing in production.


?> __Solution 1__, add scope as first argument :

```javascript
class MyClass
{
	readonly onWindowResized = new Signal()

	constructor ()
	{
		// Add this scope as first argument
		this.onWindowResized.add( this, this.myHandler )
	}

	myHandler ()
	{
		console.log( this ) // Available
	}

	removeListener ()
	{
		// Can be removed by passing scope again
		this.onWindowResize.remove( this, this.myHandler )
	}
}
```

?> __Solution 2__, set handler as an arrow function :

```javascript
class MyClass
{
	readonly onWindowResized = new Signal()

	constructor ()
	{
		this.onWindowResized.add( this.myHandler )
	}

	// This will create a function, binded to this object
	myHandler = () =>
	{
		console.log( this ) // Available
	}

	removeListener ()
	{
		// Can be removed
		this.onWindowResize.remove( this.myHandler )
	}
}
```