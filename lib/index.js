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
    return this._emit({ event, data, callback });
};


internals.Podium.prototype._emit = function (notification) {

    if (notification) {
        this._queue.push(notification);
    }

    if (this._processing ||
        !this._queue.length) {

        return;
    }

    this._processing = true;
    const queue = this._queue;
    this._queue = [];

    const each = (item, next) => {

        const eachHandler = (handler, nextHandler) => {

            if (handler.count) {
                --handler.count;
                if (handler.count < 1) {
                    this._removeHandler(item.event, handler);
                }
            }

            setImmediate(() => {

                if (handler.block) {
                    let timer = null;
                    if (handler.block !== true) {
                        nextHandler = Hoek.once(nextHandler);
                        timer = setTimeout(nextHandler, handler.block);
                    }

                    return handler.listener(item.data, () => {

                        clearTimeout(timer);
                        return nextHandler();
                    });
                }

                handler.listener(item.data);
                return nextHandler();
            });
        };

        const handlers = this._subscribers[item.event];
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

        this._processing = false;
        return this._emit();
    });
};


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (event, listener, options) {

    options = Object.assign({}, options, { listener });

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);
    Hoek.assert(typeof options.listener === 'function', `Listener must be a function for ${event}`);
    Hoek.assert(options.count === undefined || options.count > 0, `Invalid listener count option for ${event}`);
    Hoek.assert(options.block === undefined || options.block === true || Hoek.isInteger(options.block), `Invalid block option value for ${event}`);

    this._subscribers[event] = this._subscribers[event] || [];
    this._subscribers[event].push(options);

    return this;
};


internals.Podium.prototype.once = function (event, listener, options) {

    return this.on(event, listener, Object.assign({}, options, { count: 1 }));
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


internals.Podium.prototype._removeHandler = function (event, handler) {

    const handlers = this._subscribers[event];
    const filtered = handlers.filter((item) => item !== handler);
    this._subscribers[event] = (filtered.length ? filtered : null);
};
