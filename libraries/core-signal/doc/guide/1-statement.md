# Signal Statements

A signal should never be overridable from outside

```javascript
class MyClass
{
	// BAD, this Signal can be overridden from outisde
	public onWindowResized = new Signal()
}
```

?> __Solution 1__, use a getter :

```javascript
class MyClass
{
	protected _onWindowResized = new Signal()
	get onWindowResized () { return this._onWindowResized }
}
```

?> __Solution 2__, use a `readonly` property ( Typescript only ) :

```javascript
class MyClass
{
	readonly onWindowResized = new Signal()
}
```
