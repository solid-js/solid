# Typings

> The next part is only if you use Signal with Typescript.

By default, any Signals will have argument types set to `any[]`, which will disable type hint for handlers.



```javascript
const mySignal = new Signal()

mySignal.add( function (arg1, arg2, arg3, ...args) {
	// Here we do not know any arguments types
});

mySignal.dispatch("any", "types", "allowed", true, 1)
```

### Specify arguments types

You can add a list of types as a [Typescript Generic](https://www.typescriptlang.org/docs/handbook/generics.html).

```javascript
// First argument is a number
// Second argument is a boolean
const mySignal = new Signal<[number, boolean]>()

mySignal.add( function (arg1, arg2) {
	// Here typescript knows arg1 is a number
	// Here typescript knows arg2 is a boolean
});

// This will compile 👍
mySignal.dispatch(2, true)

// This will throw a Typescript error 🚨
mySignal.dispatch(true, "string")
```


### Allow optionnal arguments

You can set an argument as optionnal by adding `|void` to its type.
This will allow `dispatch()` to ommit this argument.

```javascript
// First argument is a string or nothing
const mySignal = new Signal<[string|void]>()

mySignal.add( function (arg1) {
	// Here typescript knows arg1 is either a string or undefined
});

// This will compile 👍
mySignal.dispatch("value")

// This will also compile 👍
mySignal.dispatch()
```


### Complex types

Complex type system can be infered.

```javascript
interface IMyType
{
	id        ?: number
	content   ?: string
}

const mySignal = new Signal<[IMyType]>()

mySignal.add( function (arg1) {
	// This will compile 👍
	console.log(arg1.id);

	// This will throw a Typescript error 🚨
	console.log(arg1.unknownProp);
});
```




