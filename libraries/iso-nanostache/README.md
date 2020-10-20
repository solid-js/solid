
# Why Nanostache ?

Why do we need Nanostache ? Literal template strings are available in ES6+ !
Nanostache can be useful when any **small templating** is needed when **the template source is not coming from javascript** itself.
<br>For example, if you need to process a template from a file, or any other kind of input.

Nanostache is a ultra-lightweight template engine in Node or Browsers environments.
Minified version is less than **500b** for CommonJS and a even smaller for ES-Module version.
It uses Javascript's Regex based `String.replace` function to be **super effective**.

**Typescript definitions** are included. Enjoy !

### Scope

Nanostache can do variable replacement, function calls, and short ternary. **THAT'S IT.**<br>
It **cannot** do advanced conditions, listing, HTML transformations, etc...
If you need all of this, check others template engines like [Mustache](https://mustache.github.io/), [Handlebars](https://handlebarsjs.com/) or even [React JSX](https://fr.reactjs.org/docs/introducing-jsx.html) in some cases.


### Installation

To install Nanostache in your project :<br>
```shell
npm install @solid-js/nanostache
```
or
```shell
yarn add @solid-js/nanostache
```

### Usage

If you are using CommonJS syntax :

```javascript
const { Nanostache } = require('@solid-js/nanostache')
```

Better, if ES-Modules syntax is available :

```javascript
import { Nanostache } from '@solid-js/nanostache'
```

### Simple variable replacement

```javascript
Nanostache('Hello {{username}}', {
    username: 'James Bond'
});
// 'Hello James Bond'
```

### Values can be functions 

```javascript
const user = { balance : 12 };
Nanostache('Your current balance is {{balance}}€', {
    balance: () => user.balance
});
// 'Your current balance is 12€'
```

### Ternary conditions can be used :

```javascript
Nanostache('Condition is {{test ? truthy : falsy}}', {
    test: 0
});
// 'Condition is falsy'
```

### Or, with the help of functions :
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

### More functions
```javascript
Nanostache('{{plainFunction}} == 15', {
    value: 15,
    plainFunction ()
    {
        // This works
        return this.value;
    }
});
// '15 == 15'
```

### Complex example mixing functions and ternaries
 
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

### Advanced, delimiters can be updated 

This will update delimiters from `{{var}}` to `{var}`.
Use [regexr.com](https://regexr.com) to create easily your delimiter's Regex.

```javascript
import * as nanostache from '@solid-js/nanostache';
nanostache.delimitersRegex = new RegExp('{(.*?)}', 'gm');

```