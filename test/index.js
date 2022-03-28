'use strict';

const Code = require('@hapi/code');
const Hoek = require('@hapi/hoek');
const Lab = require('@hapi/lab');
const Podium = require('..');


const internals = {};


const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


describe('Podium', () => {

    it('emits events', () => {

        const emitter = new Podium.Podium(['a', 'b', 'c', 'd']);

        const updates = [];

        emitter.on('a', (data) => updates.push({ a: data, id: 1 }));

        const handler2 = (data) => updates.push({ b: data, id: 2 });
        emitter.on('b', handler2);

        emitter.on('a', (data) => updates.push({ a: data, id: 3 }));
        emitter.on('c', (data) => updates.push({ c: data, id: 4 }));
        emitter.on({ name: 'a', count: 2 }, (data) => updates.push({ a: data, id: 5 }));

        expect(emitter.hasListeners('a')).to.be.true();

        emitter.emit({ name: 'a' }, 1);
        emitter.emit('a', 2);
        emitter.emit('b', 3);
        emitter.emit('d', 4);
        emitter.emit('b', 5);

        emitter.emit('d', 6);

        emitter.removeListener('b', handler2);
        emitter.removeListener('a', Hoek.ignore);
        emitter.removeListener('d', Hoek.ignore);

        emitter.emit('a', 7);
        emitter.emit('b', 8);

        emitter.removeAllListeners('a');
        emitter.removeAllListeners('d');

        expect(emitter.hasListeners('a')).to.be.false();

        emitter.emit('a', 9);

        expect(updates).to.equal([
            { a: 1, id: 1 },
            { a: 1, id: 3 },
            { a: 1, id: 5 },
            { a: 2, id: 1 },
            { a: 2, id: 3 },
            { a: 2, id: 5 },
            { b: 3, id: 2 },
            { b: 5, id: 2 },
            { a: 7, id: 1 },
            { a: 7, id: 3 }
        ]);
    });

    it('can be inherited from', () => {

        class Sensor extends Podium.Podium {

            constructor(type) {

                super(type);
                this._type = type;
            }

            reading(data) {

                return this.emit(this._type, data);
            }
        }

        class Thermometer extends Sensor {

            constructor() {

                super('temperature');
            }
        }

        class Hydrometer extends Sensor {

            constructor() {

                super('gravity');
            }
        }

        const thermometer = new Thermometer();
        const hydrometer = new Hydrometer();

        thermometer.on({ name: 'temperature' }, (temperature) => {

            expect(temperature).to.equal(72);
        });

        hydrometer.on({ name: 'gravity' }, (gravity) => {

            expect(gravity).to.equal(7);
        });

        thermometer.reading(72);
        hydrometer.reading(7);
    });

    describe('emit()', () => {

        it('returns callbacks in order added', () => {

            const emitter = new Podium.Podium(['a', 'b']);

            const updates = [];

            const aHandler = (data) => {

                updates.push({ a: data, id: 1 });
            };

            emitter.on({ name: 'a' }, aHandler);

            const bHandler = (data) => {

                updates.push({ b: data, id: 1 });
            };

            emitter.on('b', bHandler);

            emitter.emit('a', 1);
            updates.push('a done');
            emitter.emit('b', 1);
            expect(updates).to.equal([{ a: 1, id: 1 }, 'a done', { b: 1, id: 1 }]);
        });

        it('invokes all handlers subscribed to an event', () => {

            const emitter = new Podium.Podium('test');
            let handled = 0;
            emitter.on('test', () => {

                handled++;
            });

            emitter.on('test', () => {

                handled++;
            });

            emitter.on('test', () => {

                handled++;
            });

            emitter.emit('test', null);
            expect(handled).to.equal(3);
        });

        it('generates data once when function', () => {

            let count = 0;
            const update = () => {

                ++count;
                return { a: 1 };
            };

            const emitter = new Podium.Podium({ name: 'test' });

            let received = 0;
            emitter.on({ name: 'test', filter: 'a' }, (data) => {

                ++received;
                expect(data).to.equal({ a: 1 });
            });

            emitter.on({ name: 'test', filter: 'a' }, (data) => {

                ++received;
                expect(data).to.equal({ a: 1 });
            });

            emitter.emit({ name: 'test', tags: ['a'] }, update);
            emitter.emit({ name: 'test', tags: ['b'] }, update);

            expect(received).to.equal(2);
            expect(count).to.equal(1);
        });

        it('generates function data', () => {

            const inner = () => 5;
            let count = 0;
            const update = () => {

                ++count;
                return inner;
            };

            const emitter = new Podium.Podium({ name: 'test' });

            let received = 0;
            const handler = (data) => {

                ++received;
                expect(data).to.equal(inner);
            };

            emitter.on('test', handler);
            emitter.on('test', handler);

            emitter.emit('test', update);

            expect(count).to.equal(1);
            expect(received).to.equal(2);
        });

        it('clones data for every handler', async () => {

            const update = { a: 1 };

            const emitter = new Podium.Podium({ name: 'test', clone: true });
            const once = emitter.once('test');

            emitter.emit('test', update);

            const [data] = await once;
            expect(data).to.not.shallow.equal(update);
            expect(data).to.equal(update);
        });

        it('spreads data', () => {

            const emitter = new Podium.Podium({ name: 'test', spread: true });
            emitter.on('test', (a, b, c) => {

                expect({ a, b, c }).to.equal({ a: 1, b: 2, c: 3 });
            });

            emitter.emit('test', [1, 2, 3]);
        });

        it('spreads data (function)', () => {

            const emitter = new Podium.Podium({ name: 'test', spread: true });
            emitter.on('test', (a, b, c) => {

                expect({ a, b, c }).to.equal({ a: 1, b: 2, c: 3 });
            });

            emitter.emit('test', () => [1, 2, 3]);
        });

        it('overrides spread data on once with promise', async () => {

            const emitter = new Podium.Podium({ name: 'test', spread: true });
            const once = emitter.once('test');
            emitter.emit('test', [1, 2, 3]);
            expect(await once).to.equal([1, 2, 3]);
        });

        it('adds tags', () => {

            const emitter = new Podium.Podium({ name: 'test', tags: true });
            emitter.on('test', (data, tags) => {

                expect({ data, tags }).to.equal({ data: [1, 2, 3], tags: { a: true, b: true } });
            });

            emitter.emit({ name: 'test', tags: ['a', 'b'] }, [1, 2, 3]);
        });

        it('adds tags (spread)', () => {

            const emitter = new Podium.Podium({ name: 'test', tags: true, spread: true });
            emitter.on('test', (a, b, c, tags, ...rest) => {

                expect({ a, b, c, tags }).to.equal({ a: 1, b: 2, c: 3, tags: { a: true, b: true } });
                expect(rest).to.have.length(0);
            });

            emitter.emit({ name: 'test', tags: ['a', 'b'] }, [1, 2, 3]);
        });

        it('adds tags for multiple listeners (spread)', () => {

            const emitter = new Podium.Podium({ name: 'test', tags: true, spread: true });
            emitter.on('test', (a, b, c, tags, ...rest) => {

                expect({ a, b, c, tags }).to.equal({ a: 1, b: 2, c: 3, tags: { a: true, b: true } });
                expect(rest).to.have.length(0);
            });
            emitter.on('test', (a, b, c, tags, ...rest) => {

                expect({ a, b, c, tags }).to.equal({ a: 1, b: 2, c: 3, tags: { a: true, b: true } });
                expect(rest).to.have.length(0);
            });

            emitter.emit({ name: 'test', tags: ['a', 'b'] }, [1, 2, 3]);
        });

        it('send no tags on channel with tags enabled', () => {

            const emitter = new Podium.Podium({ name: 'test', tags: true });
            emitter.on('test', (data, tags) => {

                expect({ data, tags }).to.equal({ data: [1, 2, 3], tags: undefined });
            });

            emitter.emit({ name: 'test' }, [1, 2, 3]);
        });

        it('errors on unknown channel', () => {

            const emitter = new Podium.Podium({ name: 'test', channels: ['a', 'b'] });
            emitter.on('test', Hoek.ignore);

            expect(() => emitter.emit('test')).to.not.throw();
            expect(() => emitter.emit({ name: 'test', channel: 'a' })).to.not.throw();
            expect(() => emitter.emit({ name: 'test', channel: 'c' })).to.throw('Unknown c channel');
        });

        it('rejects when exception thrown in handler', () => {

            const emitter = new Podium.Podium(['a', 'b']);

            const updates = [];
            const aHandler = (data) => updates.push('a');
            const bHandler = (data) => {

                updates.push('b');
                throw new Error('oops');
            };

            emitter.on('a', aHandler);
            emitter.on('b', bHandler);
            emitter.emit('a', 1);

            expect(() => emitter.emit('b', 1)).to.throw('oops');
        });

        it('rejects when exception thrown in handler but process all handlers', () => {

            const emitter = new Podium.Podium(['a', 'b']);

            const updates = [];
            const handler1 = (data) => updates.push(1);
            const handler2 = (data) => {

                updates.push(2);
                throw new Error('oops');
            };

            emitter.on('a', handler1);
            emitter.on('a', handler2);
            emitter.on('a', handler1);
            emitter.on('a', handler2);
            emitter.on('a', handler1);
            expect(() => emitter.emit('a', 1)).to.throw('oops');
            expect(updates).to.equal([1, 2, 1, 2, 1]);
        });
    });

    describe('on()', () => {

        it('invokes a handler on every event', () => {

            const emitter = new Podium.Podium('test');
            let handled = 0;
            emitter.on('test', () => {

                handled++;
            });

            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test', null);
            expect(handled).to.equal(3);
        });

        it('invokes a handler with context', () => {

            const emitter = new Podium.Podium('test');
            const context = { count: 0 };
            const handler = function () {

                ++this.count;
            };

            emitter.on('test', handler, context);

            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test', null);
            expect(context.count).to.equal(3);
        });

        it('filters events using tags', () => {

            const emitter = new Podium.Podium('test');

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
            emitter.emit('test', 6);

            expect(updates).to.equal([
                { id: 1, data: 1 },
                { id: 2, data: 1 },
                { id: 1, data: 2 },
                { id: 2, data: 2 },
                { id: 3, data: 2 },
                { id: 1, data: 3 },
                { id: 1, data: 4 },
                { id: 2, data: 4 },
                { id: 1, data: 5 },
                { id: 2, data: 5 },
                { id: 3, data: 5 },
                { id: 5, data: 5 },
                { id: 1, data: 6 }
            ]);
        });

        it('filter events using channels', () => {

            const emitter = new Podium.Podium('test');

            const updates = [];
            emitter.on('test', (data) => updates.push({ id: 1, data }));
            emitter.on({ name: 'test', channels: ['a', 'b'] }, (data) => updates.push({ id: 2, data }));
            emitter.on({ name: 'test', channels: 'b' }, (data) => updates.push({ id: 3, data }));
            emitter.on({ name: 'test', channels: ['c'] }, (data) => updates.push({ id: 4, data }));

            emitter.emit({ name: 'test', channel: 'a' }, 1);
            emitter.emit({ name: 'test', channel: 'b' }, 2);
            emitter.emit({ name: 'test', channel: 'd' }, 3);
            emitter.emit({ name: 'test', channel: 'a' }, 4);
            emitter.emit('test', 6);

            expect(updates).to.equal([
                { id: 1, data: 1 },
                { id: 2, data: 1 },
                { id: 1, data: 2 },
                { id: 2, data: 2 },
                { id: 3, data: 2 },
                { id: 1, data: 3 },
                { id: 1, data: 4 },
                { id: 2, data: 4 },
                { id: 1, data: 6 }
            ]);
        });

        it('clones data', () => {

            const update = { a: 1 };

            const emitter = new Podium.Podium('test');
            emitter.on({ name: 'test', clone: true }, (data) => {

                expect(data).to.not.shallow.equal(update);
                expect(data).to.equal(update);
            });

            emitter.emit('test', update);
        });

        it('disables tags and spread', () => {

            const emitter = new Podium.Podium({ name: 'test', tags: true, spread: true });

            const handler = function (data) {

                expect(arguments.length).to.equal(1);
                expect(data).to.equal([1, 2, 3]);
            };

            emitter.on({ name: 'test', tags: false, spread: false }, handler);

            emitter.emit({ name: 'test', tags: ['a', 'b'] }, [1, 2, 3]);
        });

        it('errors on unknown channel', () => {

            const emitter = new Podium.Podium({ name: 'test', channels: ['a', 'b'] });
            expect(() => emitter.on('test', Hoek.ignore)).to.not.throw();
            expect(() => emitter.on({ name: 'test', channels: 'a' }, Hoek.ignore)).to.not.throw();
            expect(() => emitter.on({ name: 'test', channels: 'c' }, Hoek.ignore)).to.throw('Unknown event channels c');
            expect(() => emitter.on({ name: 'test', channels: ['c', 'x'] }, Hoek.ignore)).to.throw('Unknown event channels c, x');
        });
    });

    describe('addListener()', () => {

        it('invokes a handler everytime the subscribed event occurs', () => {

            const emitter = new Podium.Podium('test');
            let handled = 0;
            emitter.addListener('test', () => {

                handled++;
            });

            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test', null);
            expect(handled).to.equal(3);
        });
    });

    describe('once()', () => {

        it('invokes a handler once', () => {

            const emitter = new Podium.Podium('test');
            let counter = 0;
            emitter.once('test', () => ++counter);
            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test', null);
            expect(counter).to.equal(1);
        });

        it('invokes a handler once (promise)', async () => {

            const emitter = new Podium.Podium('test');
            const once = emitter.once('test');
            emitter.emit('test', 123);
            emitter.emit('test', null);
            const [result] = await once;
            expect(result).to.equal(123);
        });

        it('invokes a handler once with options', () => {

            const emitter = new Podium.Podium('test');
            let counter = 0;
            emitter.once({ name: 'test' }, (data) => {

                ++counter;
            });

            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test', null);
            expect(counter).to.equal(1);
        });

        it('invokes a handler once for matching channel', () => {

            const emitter = new Podium.Podium('test');
            let counter = 0;
            emitter.once({ name: 'test', channels: 'x' }, () => ++counter);
            emitter.emit({ name: 'test', channel: 'y' });
            emitter.emit({ name: 'test', channel: 'x' });
            emitter.emit('test', null);
            expect(counter).to.equal(1);
        });

        it('does not change criteria', () => {

            const emitter = new Podium.Podium('test');
            const criteria = { name: 'test' };
            emitter.once(criteria, Hoek.ignore);
            expect(criteria).to.only.contain('name');
        });
    });

    describe('few()', () => {

        it('collects multiple events', async () => {

            const emitter = new Podium.Podium('test');
            const few = emitter.few({ name: 'test', count: 3 });
            emitter.emit('test', 123);
            emitter.emit('test', 123);
            emitter.emit('test', 123);
            emitter.emit('test', null);
            const result = await few;
            expect(result).to.equal([[123], [123], [123]]);
        });
    });

    describe('removeListener()', () => {

        it('deletes a single handler from being subscribed to an event', () => {

            const emitter = new Podium.Podium('test');
            let handled = 0;
            const handler = () => {

                handled++;
            };

            emitter.addListener('test', handler);

            emitter.emit('test', null);
            emitter.removeListener('test', handler);
            emitter.emit('test', null);
            expect(handled).to.equal(1);
        });
    });

    describe('removeAllListeners()', () => {

        it('deletes all handlers from being subscribed to an event', () => {

            const emitter = new Podium.Podium('test');
            let handled = 0;
            emitter.on('test', () => {

                handled++;
            });

            emitter.on('test', () => {

                handled++;
            });

            emitter.on('test', () => {

                handled++;
            });

            emitter.emit('test', null);
            emitter.removeAllListeners('test');
            emitter.emit('test', null);
            expect(handled).to.equal(3);
        });
    });

    describe('validate()', () => {

        it('normalizes events', () => {

            expect(Podium.validate('a')).to.equal([{ name: 'a' }]);
        });

        it('errors on invalid event property', () => {

            expect(() => {

                Podium.validate({ name: 'a', unknown: 'x' });
            }).to.throw(/Invalid event options/);
        });
    });

    describe('registerEvent()', () => {

        it('ignores existing when shared is true', () => {

            const source = new Podium.Podium();
            source.registerEvent('a');
            expect(() => {

                source.registerEvent({ name: 'a', shared: true });
            }).to.not.throw();
        });

        it('errors on existing event', () => {

            const source = new Podium.Podium();
            source.registerEvent('a');
            expect(() => {

                source.registerEvent('a');
            }).to.throw('Event a exists');
        });

        it('errors on invalid event property', () => {

            const source = new Podium.Podium();
            expect(() => {

                source.registerEvent({ name: 'a', unknown: 'x' });
            }).to.throw(/Invalid event options/);
        });

        it('ignores invalid event property', () => {

            const source = new Podium.Podium();
            expect(() => {

                source.registerEvent({ name: 'a', unknown: 'x' }, { validate: false });
            }).to.not.throw();
        });
    });
});
