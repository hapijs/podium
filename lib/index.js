'use strict';

// Load modules

const Hoek = require('hoek');
const Items = require('items');


// Declare internals

const internals = {};


exports = module.exports = internals.Podium = function (events) {

    this._subscribers = Object.create(null);
    this.event(events);
};


internals.Podium.prototype.event = function (events) {

    [].concat(events).forEach((event) => {

        Hoek.assert(this._subscribers[event] === undefined, `Event ${event} exists`);
        this._subscribers[event] = null;
    });
};


internals.Podium.prototype.emit = function (event, data) {

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);

    const handlers = this._subscribers[event];
    if (!handlers) {
        return false;
    }

    const each = (handler, next) => {

        handler.listener(data);
        if (handler.count) {
            --handler.count;
            if (handler.count < 1) {
                this._removeHandler(event, handler);
            }
        }

        return next();
    };

    Items.serial(handlers.slice(), each, () => {            // Clone in case handlers are changed by handlers

    });

    return true;
};


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (event, listener, options) {

    options = Object.assign({}, options, { listener });

    Hoek.assert(this._subscribers[event] !== undefined, `Unknown event ${event}`);
    Hoek.assert(typeof options.listener === 'function', 'Listener must be a function');
    Hoek.assert(options.count === undefined || options.count > 0, 'Invalid listener count option');

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
