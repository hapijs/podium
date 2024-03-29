import { Podium } from '..';
import * as Lab from '@hapi/lab';

const { expect } = Lab.types;

// Podium()

expect.type<Podium>(new Podium());
expect.type<Podium>(new Podium('test'));
expect.type<Podium>(new Podium(['a', { name: 'b', channels: ['c'] }]));
expect.type<Podium>(new Podium('test', { validate: true }));

expect.error(new Podium(new Podium()));

const podium = new Podium();

// registerEvent()

expect.type<void>(podium.registerEvent('test'));
expect.type<void>(podium.registerEvent(['a', { name: 'b', channels: ['c'] }]));
expect.type<void>(podium.registerEvent('c', { validate: true }))
expect.error(podium.registerEvent());
expect.error(podium.registerEvent(new Podium()));
expect.error(podium.registerEvent(123));
expect.error(podium.registerEvent([Symbol()]));
expect.error(podium.registerEvent('d', { unknown: false }))

// emit()

expect.type<void>(podium.emit('test'));
expect.type<void>(podium.emit('test', { data: true }));
expect.type<void>(podium.emit({ name: 'test', channel: 'a', tags: 'b' }, { data: true }));
expect.type<void>(podium.emit({ name: 'test', tags: ['b'] }));
expect.type<void>(podium.emit({ name: 'test', tags: { b: true } }));

expect.error(podium.emit());
expect.error(podium.emit(123));
expect.error(podium.emit({ channel: 'a' }));
expect.error(podium.emit({ name: 123 }));
expect.error(podium.emit({ name: 'test', channel: 123 }));
expect.error(podium.emit({ name: 'test', tags: 123 }));

// gauge()

expect.type<Promise<PromiseSettledResult<unknown>[]>>(podium.gauge('test'));
expect.type<Promise<PromiseSettledResult<string>[]>>(podium.gauge<string>('test'));
expect.type<Promise<PromiseSettledResult<unknown>[]>>(podium.gauge('test', { data: true }));
expect.type<Promise<PromiseSettledResult<unknown>[]>>(podium.gauge({ name: 'test', channel: 'a', tags: 'b' }, { data: true }));
expect.type<Promise<PromiseSettledResult<unknown>[]>>(podium.gauge({ name: 'test', tags: ['b'] }));
expect.type<Promise<PromiseSettledResult<unknown>[]>>(podium.gauge({ name: 'test', tags: { b: true } }));

expect.error(podium.gauge());
expect.error(podium.gauge(123));
expect.error(podium.gauge({ channel: 'a' }));
expect.error(podium.gauge({ name: 123 }));
expect.error(podium.gauge({ name: 'test', channel: 123 }));
expect.error(podium.gauge({ name: 'test', tags: 123 }));

// on()

expect.type<Podium>(podium.on('test', function () { this instanceof Podium; }));
expect.type<Podium>(podium.on('test', function () { this.ok; }, { ok: true }));
expect.type<Podium>(podium.on({ name: 'test' }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', channels: 'a' }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', filter: 'a' }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', filter: { all: true, tags: ['a', 'b'] } }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', tags: true }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', clone: true }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', spread: true }, function () { }));
expect.type<Podium>(podium.on({ name: 'test', count: 3 }, function () { }));
expect.type<Podium>(podium.on('test', function (a, b) {

    expect.type<unknown>(a);
    expect.type<unknown>(b);
}));
expect.type<Podium>(podium.on('test', function (a: string, b: number) {

    expect.type<string>(a);
    expect.type<number>(b);
}));

expect.error(podium.on());
expect.error(podium.on('test'));
expect.error(podium.on(123, function () { }));
expect.error(podium.on('test', Podium));
expect.error(podium.on('test', function () { }), 123);
expect.error(podium.on('test', function () { this.notOk; }, { ok: true }));

// addListener()

expect.type<Podium>(podium.addListener('test', function () { this instanceof Podium; }));
expect.type<Podium>(podium.addListener('test', function () { this.ok; }, { ok: true }));
expect.type<Podium>(podium.addListener('test', () => true));
expect.type<Podium>(podium.addListener<[a: string, b: number], { ok: boolean }>('test', function (a, b) {

    expect.type<boolean>(this.ok);
    expect.type<string>(a);
    expect.type<number>(b);
}, { ok: true }));

expect.error(podium.addListener());
expect.error(podium.addListener('test'));
expect.error(podium.addListener(123, function () { }));
expect.error(podium.addListener('test', Podium));
expect.error(podium.addListener('test', function () { this.notOk; }, { ok: true }));
expect.error(podium.once({ name: 'test', unknown: true }, function () { }));

// once()

expect.type<Podium>(podium.once('test', function () { this instanceof Podium; }));
expect.type<Podium>(podium.once('test', function () { this.ok; }, { ok: true }));
expect.type<Podium>(podium.once({ name: 'test' }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', channels: 'a' }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', filter: 'a' }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', filter: { all: true, tags: ['a', 'b'] } }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', tags: true }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', clone: true }, function () { }));
expect.type<Podium>(podium.once({ name: 'test', spread: true }, function () { }));
expect.type<Promise<unknown[]>>(podium.once('test'));
expect.type<Promise<[a: number]>>(podium.once<[ a: number]>('test'));
expect.type<Podium>(podium.once('test', function (a: string, b: number) {

    expect.type<string>(a);
    expect.type<number>(b);
}));

expect.error(podium.once());
expect.error(podium.once(123, function () { }));
expect.error(podium.once('test', Podium));
expect.error(podium.once('test', function () { this.notOk; }, { ok: true }));
expect.error(podium.once({ name: 'test', unknown: true }, function () { }));
expect.error(podium.once({ name: 'test', count: 3 }, function () { }));

// few()

expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2 }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, channels: 'a' }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, filter: 'a' }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, filter: { all: true, tags: ['a', 'b'] } }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, tags: true }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, clone: true }));
expect.type<Promise<unknown[]>>(podium.few({ name: 'test', count: 2, spread: true }));

expect.type<Promise<[a: number]>>(podium.few<[a: number]>({ name: 'test', count: 2 }));

expect.error(podium.few());
expect.error(podium.few(123));
expect.error(podium.few('test'));
expect.error(podium.few({ name: 'test' }));
expect.error(podium.few({ name: 'test', unknown: true }));

// removeListener()

expect.type<Podium>(podium.removeListener('test', function () { }));

expect.error(podium.removeListener());
expect.error(podium.removeListener('test'));
expect.error(podium.removeListener('test', Podium));
expect.error(podium.removeListener(123, function () { }));

// removeAllListeners()

expect.type<Podium>(podium.removeAllListeners('test'));

expect.error(podium.removeAllListeners());
expect.error(podium.removeAllListeners(123));
expect.error(podium.removeAllListeners('test', function () { }));

// hasListeners()

expect.type<boolean>(podium.hasListeners('test'));

expect.error(podium.hasListeners());
expect.error(podium.hasListeners(123));

// Allows custom events in a subclass declaration

interface MyPodiumEvents {
    test: (a: string, b: number) => void;
}

const mypodium = new Podium<MyPodiumEvents>(['test']);

expect.type<Podium<MyPodiumEvents>>(mypodium.on('test', function (a, b) {

    expect.type<string>(a);
    expect.type<number>(b);
}));
expect.type<Promise<[a: string, b: number]>>(mypodium.once('test'));
expect.type<void>(mypodium.emit('test', ['a', 3]))

expect.error(mypodium.on('test', function (a: number) { }));
expect.error(mypodium.on('test2', function () { }));
expect.error(mypodium.emit('test', 'a'))
expect.error(mypodium.emit('test', ['a']))
expect.error(mypodium.emit('test', [3]))
expect.error(mypodium.emit('test', ['a', 'b']))

expect.error(new Podium<MyPodiumEvents>('test2'));
expect.error(new Podium<MyPodiumEvents>(['test2']));
