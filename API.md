
## Introduction

**podium** is an event emitter with support for tags, filters, channels, event update cloning,
arguments spreading, and other features useful when building large scale applications.
While node's native [`EventEmitter`](https://nodejs.org/docs/latest-v12.x/api/events.html#events_class_eventemitter) is strictly focused on maximum performance,
it lacks many features that do not belong in the core implementation. **podium** is not restricted by
node's performance requirement as it is designed for application layer needs where its overhead
is largely insignificant as implementing these features will have similar cost on top of the native emitter.

## Example

```js
const Podium = require('@hapi/podium');

const emitter = new Podium()

const context = { count: 0 }

emitter.registerEvent({
    name: 'event',
    channels: ['ch1', 'ch2']
})

const handler1 = function () {

    ++this.count
    console.log(this.count)
};

const handler2 = function () {

    this.count = this.count + 2
    console.log(this.count)
}

emitter.on({
    name: 'event',
    channels: ['ch1']
}, handler1, context);

emitter.on({
    name: 'event',
    channels: ['ch2']
}, handler2, context)

emitter.emit({
    name: 'event',
    channel: 'ch1'
})

emitter.emit({
    name: 'event',
    channel: 'ch2'
})

emitter.hasListeners('event') // true

emitter.removeAllListeners('event') // Removes all listeners subscribed to 'event'
```

The above example uses podium's channel event parameter to restrict the event update to only the specified channel. 

First you register the event by calling the `registerEvent()` method. Here, you name the event `'event'` and give it channels `['ch1', 'ch2']`.

Next you specify your listener handlers. These will be called when an event is updated. Here you make use of podium's listener context, data that you can bind to your listener handlers. 
In this case, `handler1` will add 1 to count, which is specified as `{ count: 0 }`, while `handler2` will add 2.

Next you call the `on()` method to subscribe a handler to an event. You use the same event name, but two different channels. `'ch1'` will use handler1 and `'ch2'` will use handler2.

Lastly, you use `emit()` to emit and event update to the subscribers. 


### <a name='parameters'></a> `Using different parameters`

Along with channels, podium allows you to specify other event parameters. Below are more examples:

- [`channels`](#channels)
- [`clone`](#clone)
- [`spread`](#spread)
- [`shared`](#shared)
- [`tag-filter`](#tagFilter)
- [`count`](#count)

#### <a name="channels"></a>`channels`

```js
const Podium = require('@hapi/podium');
const podiumObject = new Podium();

podiumObject.registerEvent([
    {
        name: 'event1',
        channels: ['ch1', 'ch2', 'ch3', 'ch4'],
    },
    {
        name: 'event2',
        channels: ['ch1', 'ch2']
    }
]);
const listener1 = (data) => {

    console.log('listener1 called', data);
};
const listener2 = (data) => {

    console.log('listener2 called', data);
};

podiumObject.on({
    name: 'event1',
    channels: ['ch1']
}, listener1);

podiumObject.on({
    name: 'event1',
    channels: ['ch3', 'ch4']
}, listener2);


podiumObject.on({ name: 'event1', channels: 'ch2' }, (data) => { // autonomous function

    console.log('auto', data);
});

var arr = [0, 1, 2, 3, 4, 4, 5];

podiumObject.emit({
    name: 'event1',
    channel: 'ch3'
});
```

#### <a name="clone"></a>`clone`

```js
const Podium = require('@hapi/podium');
const podiumObject = new Podium();

podiumObject.registerEvent([
    {
        name: 'event1',
        channels: ['ch1', 'ch2'],
        clone: true
    },
    {
        name: 'event2',
        channels: ['ch1', 'ch2']
    }
]);

const listener1 = (data) => {

    data[0] = 55;
    console.log('listener1 called', data);
};
const listener2 = (data) => {

    data[0] = 100;
    console.log('listener2 called', data);
};

podiumObject.on({
    name: 'event1',
    channels: ['ch1']
}, listener1);

podiumObject.on({
    name: 'event2',
    channels: ['ch1']
}, listener2);

var arr = [0, 1, 2, 3, 4, 4, 5];

console.log('initially: ', arr);

podiumObject.emit({
    name: 'event1',
    channel: 'ch1'
});

console.log('after event1, ch1: ', arr);

podiumObject.emit({
    name: 'event2',
    channel: 'ch1'
});

console.log('after event2, ch1: ', arr);
```

#### <a name="spread"></a>`spread`

```js
const Podium = require('@hapi/podium');
const podiumObject = new Podium();

podiumObject.registerEvent([
    {
        name: 'event1',
        channels: ['ch1', 'ch2'],
        spread: true
    },
    {
        name: 'event2',
        channels: ['ch1', 'ch2']
    }
]);

const listener1 = (data1, data2, data3, data4) => {

    console.log('listener1 called', data1, data2, data3, data4);
};

const listener2 = (data) => {

    data[0] = 100;
    console.log('listener2 called', data);
};

podiumObject.on({
    name: 'event1',
    channels: ['ch1']
}, listener1);

podiumObject.on({
    name: 'event2',
    channels: ['ch1']
}, listener2);

var arr = [0, 1, 2, 3, 4, 4, 5];

console.log('initially: ', arr);

podiumObject.emit({
    name: 'event1',
    channel: 'ch1'
});

console.log('after event1, ch1: ', arr);

podiumObject.emit({
    name: 'event2',
    channel: 'ch1'
});
console.log('after event2, ch1: ', arr);
```

#### <a name="shared"></a>`shared`

```js
const Podium = require('@hapi/podium');
const podiumObject = new Podium();

podiumObject.registerEvent([
    {
        name: 'event1',
        channels: ['ch1', 'ch2'],
    }
]);
podiumObject.registerEvent([
    {
        name: 'event1',
        channels: ['ch1', 'ch2'],
        shared: true
    }
]);
const listener2 = (data) => {

    console.log('listener2 called', data);
};

podiumObject.on({
    name: 'event1',
    channels: ['ch1']
}, listener2);

var arr = [0, 1, 2, 3, 4, 4, 5];

podiumObject.emit({
    name: 'event1',
    channel: 'ch1'
});
```

#### <a name="tagFilter"></a>`tag-filter`

```js
const Podium = require('@hapi/podium');
const emitter = new Podium('test');

const updates = [];
emitter.on('test', (data) => updates.push({ id: 1, data }));
emitter.on({ name: 'test', filter: ['a', 'b'] }, (data) => updates.push({ id: 2, data }));
emitter.on({ name: 'test', filter: 'b' }, (data) => updates.push({ id: 3, data }));
emitter.on({ name: 'test', filter: ['c'] }, (data) => updates.push({ id: 4, data }));
emitter.on({ name: 'test', filter: { tags: ['a', 'b'], all: true } }, (data) => updates.push({ id: 5, data }));

emitter.emit({ name: 'test', tags: 'a' }, 1);
emitter.emit({ name: 'test', tags: ['b'] }, 2);
emitter.emit({ name: 'test', tags: ['d'] }, 3);
emitter.emit({ name: 'test', tags: ['a'] }, 4);
emitter.emit({ name: 'test', tags: ['a', 'b'] }, 5);

emitter.emit('test', 6, () => {

    console.log(updates);
});
```

#### <a name="count"></a>`count`

```js
const Podium = require('@hapi/podium');
const podiumObject = new Podium();

podiumObject.registerEvent('event1');

const listener1 = function(data) {

    console.log('listener1 called', data);
};

podiumObject.on({
    name: 'event1',
    count: 2
}, listener1);

podiumObject.emit('event1', 'emit 1');
podiumObject.emit('event1', 'emit 2');
podiumObject.emit('event1', 'emit 3'); // this wont call listener1
```


## `new Podium(events, options)`

Creates a new **podium** emitter where:
- `events` - if present, the value is passed to [`podium.registerEvent()`](#podiumregistereventevents).
- `options` - optional configuration options passed to [`podium.registerEvent()`](#podiumregistereventevents).

Returns a `Podium` object.

## `podium.registerEvent(events, options)`

Register the specified events and their optional configuration. Events must be registered before
they can be emitted or subscribed to. This is done to detect event name misspelling and invalid
event activities. The `events` argument can be:
- an event **string**.
- an event options object with the following optional keys (unless noted otherwise):
    - `name` - the event name **string (required)**.
    - `channels` - a **string** or **array of strings** specifying the event channels available. **Defaults
       to no channel restrictions (event updates can specify a channel or not).**
    - `clone` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        is cloned before it is passed to the listeners (unless an override specified by each listener).
        **Defaults to `false` (`data` is passed as-is).**
    - `spread` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        **must be an array** and the `listener` method is called with each array element passed as a separate
        argument (unless an override specified by each listener). **This should only be used when the emitted
        data structure is known and predictable.**
        **Defaults to `false` (`data` is emitted as a single argument regardless of its type).**
    - `tags` - if `true` and the `criteria` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        includes `tags`, the tags are mapped to an object (where each tag string is the key and
        the value is `true`) which is appended to the arguments list at the end. A configuration override can be set by each
        listener. **Defaults to `false`.**
    - `shared` - if `true`, the same event `name` can be registered multiple times where the second
      registration is ignored. **Note that if the registration config is changed between registrations,
      only the first configuration is used. Defaults to `false` (a duplicate registration will throw an
      error).** For detailed examples of event parameters [see here](#parameters)
- a `Podium` object which is passed to [`podium.registerPodium()`](#podiumregisterpodiumpodiums).
- an array containing any of the above.

The `options` argument is an object with the following optional properties:
- `validate` - if `true`, events declarations are validated. **Defaults to `true`**

## `podium.registerPodium(podiums)`

Registers another emitter as an event source for the current emitter (any event update emitted by the
source emitter is passed to any subscriber of the current emitter) where:
- `podiums` - a `Podium` object or an array of objects, each added as a source.

Note that any events registered with a source emitter are automatically added to the current emitter.
If the events are already registered, they are left as-is.

## `podium.emit(criteria, data)`

Emits an event update to all the subscribed listeners where:
- `criteria` - the event update criteria which must be one of:
    - the event name string.
    - an object with the following optional keys (unless noted otherwise):
        - `name` - the event name string (required).
        - `channel` - the channel name string.
        - `tags` - a tag string or array of tag strings.
- `data` - the value emitted to the subscribers.

## `podium.on(criteria, listener, context)`

Subscribe a handler to an event where:
- `criteria` - the subscription criteria which must be one of the following:
    - event name **string**.
    - a criteria object with the following optional keys (unless noted otherwise):
        - `name` - the event name **string (required)**.
        - `channels` - a **string** or **array of strings** specifying the event channels to subscribe to.
          If the event registration specified a list of allowed channels, the `channels` array must
          match the allowed channels. If `channels` are specified, event updates without any
          channel designation will not be included in the subscription. **Defaults to no channels
          filter.**
        - `clone` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
           is cloned before it is passed to the `listener` method. **Defaults to the event
           registration option (which defaults to `false`).**
        - `count` - a positive **integer** indicating the number of times the `listener` can be called
          after which the subscription is automatically removed. A count of `1` is the same as
          calling `podium.once()`. **Defaults to no limit.**
        - `filter` - the event tags (if present) to subscribe to which can be one of the following:
            - a tag **string**.
            - an **array** of tag **strings**.
            - an object with the following:
                - `tags` - a tag **string** or **array** of tag **strings**.
                - `all` - if `true`, all `tags` must be present for the event update to match the
                  subscription. **Defaults to `false` (at least one matching tag).**
        - `spread` - if `true`, and the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
          is an **array**, the `listener` method is called with each **array element** passed as a separate
          argument. **This should only be used when the emitted data structure is known and predictable.
          Defaults to the event registration option (which defaults to `false`).**
        - `tags` - if `true` and the `criteria` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
          includes `tags`, the tags are mapped to an object (where each tag string is the key and
          the value is `true`) which is appended to the arguments list at the end. **Defaults to the event registration option
          (which defaults to `false`).**
- `listener` - the handler method set to receive event updates. The function signature depends
  on the `spread`, and `tags` options.
- `context` - an **object** that binds to the listener handler.

## `podium.addListener(criteria, listener, context)`

Same as [`podium.on()`](#podiumoncriteria-listener).

## `podium.once(criteria, listener, context)`

Same as calling [`podium.on()`](#podiumoncriteria-listener) with the `count` option set to `1`.

## `podium.once(criteria)`

Same as calling [`podium.on()`](#podiumoncriteria-listener) with the `count` option set to `1`.

Return a promise that resolves when the event is emitted. The resolution value is an array of emitted arguments.

## `podium.few(criteria, context)`

Same as calling [`podium.on()`](#podiumoncriteria-listener) with the `count` option, except it is required.

Returns a promise that resolves when the event is emitted `count` times. The resolution value is an array where each item is an array of emitted arguments.

## `podium.removeListener(name, listener)`

Removes all listeners subscribed to a given event name matching the provided listener method where:
- `name` - the event name **string**.
- `listener` - the function reference provided when subscribed.

Returns a reference to the current emitter.

## `podium.removeAllListeners(name)`

Removes all listeners subscribed to a given event name where:
- `name` - the event name **string**.

Returns a reference to the current emitter.

## `podium.hasListeners(name)`

Returns whether an event has any listeners subscribed where:
- `name` - the event name **string**.

Returns `true` if the event name has any listeners, otherwise `false`.

## `Podium.validate(events)`

Takes the specified events and validates that the declaration is correct. Events can be declared
in any of the formats supported by the `registerEvent` method. When the declaration is valid
an array of valid events is returned, otherwise a validation error is thrown.
