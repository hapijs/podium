'use strict';

// Load modules

const Hoek = require('hoek');
const Items = require('items');


// Declare internals

const internals = {};


exports = module.exports = internals.Podium = function (events) {

    this._subscribers = Object.create(null);
    this._queue = [];
    this._processing = false;

    this.event(events);
};


internals.Podium.prototype.event = function (events) {

    [].concat(events).forEach((event) => {

        Hoek.assert(this._subscribers[event] === undefined, `Event ${event} exists`);
        this._subscribers[event] = null;
    });
};


internals.Podium.prototype.emit = function (event, data, callback) {

    callback = callback || Hoek.ignore;

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);
    return internals.emit(this, { event, data, callback });
};


internals.emit = function (emitter, notification) {

    if (notification) {
        emitter._queue.push(notification);
    }

    if (emitter._processing ||
        !emitter._queue.length) {

        return;
    }

    emitter._processing = true;
    const queue = emitter._queue;
    emitter._queue = [];

    const each = (item, next) => {

        const eachHandler = (handler, nextHandler) => {

            if (handler.count) {
                --handler.count;
                if (handler.count < 1) {
                    internals.removeHandler(emitter, item.event, handler);
                }
            }

            setImmediate(() => {

                const data = (handler.clone ? Hoek.clone(item.data) : item.data);

                if (handler.block) {
                    let timer = null;
                    if (handler.block !== true) {
                        nextHandler = Hoek.once(nextHandler);
                        timer = setTimeout(nextHandler, handler.block);
                    }

                    return handler.listener(data, () => {

                        clearTimeout(timer);
                        return nextHandler();
                    });
                }

                handler.listener(data);
                return nextHandler();
            });
        };

        const handlers = emitter._subscribers[item.event];
        if (!handlers) {
            setImmediate(item.callback);
            return next();
        }

        Items.parallel(handlers.slice(), eachHandler, () => {       // Clone in case handlers are changed by listeners

            item.callback();
            return next();
        });
    };

    Items.serial(queue, each, () => {

        emitter._processing = false;
        return internals.emit(emitter);
    });
};


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (event, options, listener) {

    if (typeof options === 'function') {
        listener = options;
        options = {};
    }

    options = Object.assign({}, options, { listener });

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);
    Hoek.assert(typeof options.listener === 'function', `Listener must be a function for ${event}`);
    Hoek.assert(options.count === undefined || options.count > 0, `Invalid listener count option for ${event}`);
    Hoek.assert(options.block === undefined || options.block === true || Hoek.isInteger(options.block), `Invalid block option value for ${event}`);

    this._subscribers[event] = this._subscribers[event] || [];
    this._subscribers[event].push(options);

    return this;
};


internals.Podium.prototype.once = function (event, options, listener) {

    if (typeof options === 'function') {
        listener = options;
        options = {};
    }

    return this.on(event, Object.assign({}, options, { count: 1 }), listener);
};


internals.Podium.prototype.removeListener = function (event, listener) {

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);
    Hoek.assert(typeof listener === 'function', 'Listener must be a function');

    const handlers = this._subscribers[event];
    if (!handlers) {
        return this;
    }

    const filtered = handlers.filter((handler) => handler.listener !== listener);
    this._subscribers[event] = (filtered.length ? filtered : null);
    return this;
};


internals.Podium.prototype.removeAllListeners = function (event) {

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);

    this._subscribers[event] = null;
    return this;
};


internals.removeHandler = function (emitter, event, handler) {

    const handlers = emitter._subscribers[event];
    const filtered = handlers.filter((item) => item !== handler);
    emitter._subscribers[event] = (filtered.length ? filtered : null);
};
