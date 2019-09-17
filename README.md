<a href="http://hapijs.com"><img src="https://raw.githubusercontent.com/hapijs/assets/master/images/family.png" width="180px" align="right" /></a>

# @hapi/podium

Node (semi) compatible event emitter with extra features.

**podium** is an event emitter with support for tags, filters, channels, event update cloning,
arguments spreading, and other features useful when building large scale applications.
While node's native [`EventEmitter`](https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter) is strictly focused on maximum performance,
it lacks many features that do not belong in the core implementation. **podium** is not restricted by
node's performance requirement as it is designed for application layer needs where its overhead
is largely insignificant as implementing these features will have similar cost on top of the native emitter.

[![Build Status](https://secure.travis-ci.org/hapijs/podium.svg)](http://travis-ci.org/hapijs/podium)

## API

[**API documentation**](https://github.com/hapijs/podium/blob/master/API.md).

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


## <a name='parameters'></a> `Using different parameters`

Along with channels, podium allows you to specify other event parameters. Below are more examples:

- [`channels`](#channels)
- [`clone`](#clone)
- [`spread`](#spread)
- [`shared`](#shared)
- [`tag-filter`](#tagFilter)
- [`count`](#count)

### <a name="channels"></a>`channels`

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

### <a name="clone"></a>`clone`

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

### <a name="spread"></a>`spread`

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

### <a name="shared"></a>`shared`

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

### <a name="tagFilter"></a>`tag-filter`

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

### <a name="count"></a>`count`

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


