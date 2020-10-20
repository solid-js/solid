# Add and call

In some cases, we need to call handler after an `add()` to init its state.

!> For example this code :

```javascript
class MyClass
{
	readonly onModelInitialized = new Signal()

	constructor ()
	{
		this.onModelInitialized.add( this, this.modelInitializedHandler )
		this.modelInitializedHandler( "firstArgument" )
	}

	modelInitializedHandler ( arg1 )
	{
		console.log( arg1 ) // "firstArgument"
	}
}
```

?> Can be replaced by this code.

```javascript
class MyClass
{
	readonly onModelInitialized = new Signal()

	constructor ()
	{
		// Will attach listener AND call handler with arguments
		this.onModelInitialized.add( this, this.modelInitializedHandler, ["firstArgument"] )
	}

	modelInitializedHandler ( arg1 )
	{
		console.log( arg1 ) // "firstArgument"
	}
}
```