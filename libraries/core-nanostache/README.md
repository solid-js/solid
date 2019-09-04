
# Why Nanostache ?

Why do you need Nanostache since literal template strings are available in ES6+ ?
Nanostache can be useful when any templating is needed when the template source is not coming from javascript itself.
For example, if you need to process a template from a file, or any other kind of input.
Nanostache is a ultra-lightweight template engine in Node or Browsers environments.
Minified version is **500b** for CommonJS and a little smaller for ES-Module version.
It uses Javascript's Regex based String.replace function to be super effective.
Typescript definitions are included. Enjoy !

### Scope

Nanostache can do variable replacement, and short ternary. **THAT'S IT.**<br>
It **cannot** do advanced conditions, listing, html transforms, etc...
If you need all of this, check others template engines like [Mustache](https://mustache.github.io/), [Handlebars](https://handlebarsjs.com/) or even [React JSX](https://fr.reactjs.org/docs/introducing-jsx.html) in some cases.


### Installation

To install Nanostache in your project :
- `npm install @solid-js/nanostache`
- or
- `yarn add @solid-js/nanostache`

### Usage

If you are using CommonJS syntax :

```javascript
const { Nanostache } = require('@solid-js/nanostache')
```

Better, if ES-Modules syntax is available :

```javascript
import { Nanostache } from '@solid-js/nanostache'
```

##### Simple variable replacement

```javascript
Nanostache('Hello {{username}}', {
    username: 'James Bond'
});
// 'Hello James Bond'
```

##### Values can be functions 

```javascript
const user = { balance : 12 };
Nanostache('Your current balance is {{balance}}€', {
    balance: () => user.balance
});
// 'Your current balance is 12€'
```

##### Ternary conditions can be used :

```javascript
Nanostache('Condition is {{test ? truthy : falsy}}', {
    test: 0
});
// 'Condition is falsy'
```

##### Or, with the help of functions :
```javascript
Nanostache('{{name}} is {{age}} {{isAgePlural ? years : year}} old', {
    name: 'Brad Pitt',
    age: 55,
    // Note that v here is the current value object
    // So we can access dynamically to the age property
    isAgePlural: v => v.age > 1
});
// 'Brad Pitt is 55 years old'
```

##### Complex example mixing functions and ternaries
 
```javascript
const user = {
    name: 'James Bond',
    gender: 'male',
    balance: 15
}
Nanostache('Hello {{ isMale ? mr : mrs }} {{ getLastName }}. Your balance is {{ balance }}€.', {
  ...user,
  isMale: v => v.gender == 'male',
  getLastName: v => v.name.split(' ')[1]
});
// 'Hello mr Bond. Your balance is 15€.'
```