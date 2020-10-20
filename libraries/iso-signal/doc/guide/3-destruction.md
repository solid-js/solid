# Signal destruction

To avoid memory leaks, it is advised to destroy every Signal which will not be used anymore.

### Dispose

Simply call `dispose()` method on any Signal to dettach every listeners. After calling `dispose()` a Signal is not usable.


### Delete

If you declare your Signal as a `protected` property, you can also delete its reference to hint the garbage collector to free it.
This is the safest way to destruct Signals associated to `class` objects.

```javascript
class MyClass
{
	protected _onWindowResized = new Signal()
	get onWindowResized () { return this._onWindowResized }

	dispose ()
	{
		this._onWindowResized.dispose();
		delete this._onWindowResized;
	}
}
```
> __NOTE__ : `delete` cannot be done with `readonly` statements.