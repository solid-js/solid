# iso-log TODO

- 100% Isomorphique Node / Browser
- API simple
- Couleurs si possible
- Possible d'avoir un flux stderr et un flux stdout
- Possible d'avoir les ms entre chaque action (action qui dure quelque temps)
- Pouvoir log out en str pour enregistrer en fichier log avec Files
- Pouvoir filtrer
- Pouvoir supprimer entièrement en production


# Proposition 1

```typescript
import Logger from '@solid-js/logger'


/** Save streams **/

// Logger.onEvent is a signal listening to each events
// Save every log to corresponding file
Logger.onEvent.add( (scope:string, level:string, content:string, object?:object) => {
	// scope : HTTP
    // level : warning
    // content : Unable to connect username
    // object : UserObject {}
    // In node, save object to string with util.inspect :
    // https://nodejs.org/en/knowledge/getting-started/how-to-use-util-inspect/
    
	// -> Save log file append
})

// Pipe every log to console
Logger.pipeOut( console.log ); // notice, log, success, warning
Logger.pipeError( console.error ); // error

// Only keep errors in browser in production
process.env.NODE_ENV !== 'production' && Logger.pipeOut( console.log )
Logger.pipeError( console.error )


/** Init a scope **/

// Create a scope to debug a specific subject. Here subject is HTTP
const httpDebug = Logger.scope('HTTP');


/** Classic methods **/

// All logging methods are like so :
// Object is optional and shown as classic console.log
// in browser and node to keep native behavior
const method = ( string:string, object?:object ) => void

// Log to stdout - Color is in grey
httpDebug.notice(`This is a log ${myVar}`);
httpDebug.notice(`This will show object content`, complexObject);

// Log to stdout - Color is in white
httpDebug.log(`This is a classic log`, complexObject)

// Log to stdout - Color is in green
httpDebug.success(`This is a success message`);

// Log to stdout - Color is in orange
httpDebug.warning(`This is a warning message`);

// Log to stderr - Color is in red
httpDebug.error(`This is an error`, complexErrorObject);

/** V2 - Sub scope task **/

// Ajouter un sous-scope.
// NOTE : Est-ce vraiment utile ? Peut-être en V2 si ça se montre utile ?
httpDebug.scope('security').warning('Security warning');
// -> HTTP:security - Security warning

/** V2 - Timed events **/

// Suivre une tâche avec une durée
// NOTE : Est-ce vraiment utile ? Peut-être en V2 si ça se montre utile ?    
const timedEvent = httpDebug.start(`Connecting to server ...`);
// ... some long task
timedEvent(`Connected`);
/**
 * HTTP - Connecting to server ...
 * HTTP - Connected - 122ms
 */

```



