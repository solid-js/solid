# Naming Signals

Signals should always be named correctly to be recognizable throughout your entire app.
Here is the naming convention we use with Solid-JS, we strongly recommand you to follow it :

- Signal names should always starts with `on`.
- Signal names should always clearly express action and subjet.
- Signal names should use preterit if possible.

### Some examples :
- `onWindowResized`
- `onUserSubscribed`
- `onMessageReceived`
- `onErrorThrown`

### Bad examples :
!> Do not name Signals like so :
- `userConnectingSignal`
- `messageReception`

### Ok examples :
- `onReady` (without preterit, to avoid `onReadinessStateChanged` for example)

### Auto-complete

If you follow those simple rules while naming your signals, auto-completion will work great, especially if you work with typescript :


```javascript
myObject.on // will show every signals on myObject
// ...
myObject.onModelConnected
myObject.onThingUpdated
// ...
```