'use strict';

// Load modules

const Code = require('code');
const Hoek = require('hoek');
const Lab = require('lab');
const Podium = require('..');


// Declare internals

const internals = {};


// Test shortcuts

const lab = exports.lab = Lab.script();
const describe = lab.experiment;
const it = lab.it;
const expect = Code.expect;


describe('Podium', () => {

    it('emits events', (done) => {

        const emitter = new Podium();

        const updates = [];

        emitter.on('a', (data) => updates.push({ a: data, id: 1 }));

        const handler2 = (data) => updates.push({ b: data, id: 2 });
        emitter.on('b', handler2);

        emitter.on('a', (data) => updates.push({ a: data, id: 3 }));
        emitter.on('c', (data) => updates.push({ c: data, id: 4 }));
        emitter.on('a', (data) => updates.push({ a: data, id: 5 }), { count: 2 });

        emitter.emit('a', 1);
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

        done();
    });

    describe('once()', () => {

        it('invokes a handler once', (done) => {

            const emitter = new Podium();
            let counter = 0;
            emitter.once('test', () => ++counter);
            emitter.emit('test');
            emitter.emit('test');
            emitter.emit('test');

            expect(counter).to.equal(1);
            done();
        });
    });
});
