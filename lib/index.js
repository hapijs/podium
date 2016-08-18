'use strict';

// Load modules

const Hoek = require('hoek');
const Items = require('items');


// Declare internals

const internals = {};


exports = module.exports = internals.Podium = function () {

    this._events = Object.create(null);
    this._eventsCount = 0;
};


internals.Podium.prototype.emit = function (type, data) {

    const handlers = this._events[type];
    if (!handlers) {
        return false;
    }

    const each = (handler, next) => {

        handler.listener(data);
        if (handler.count) {
            --handler.count;
            if (handler.count < 1) {
                this._removeHandler(type, handler);
            }
        }

        return next();
    };

    Items.serial(handlers.slice(), each, () => {            // Clone in case handlers are changed by handlers

    });

    return true;
};


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (type, listener, options) {

    options = Object.assign({}, options, { listener });

    Hoek.assert(typeof options.listener === 'function', 'Listener must be a function');
    Hoek.assert(options.count === undefined || options.count > 0, 'Invalid listener count option');

    this._events[type] = this._events[type] || [];
    this._events[type].push(options);

    return this;
};


internals.Podium.prototype.once = function (type, listener, options) {

    return this.on(type, listener, Object.assign({}, options, { count: 1 }));
};


internals.Podium.prototype.removeListener = function (type, listener) {

    Hoek.assert(typeof listener === 'function', 'Listener must be a function');

    const handlers = this._events[type];
    if (!handlers) {
        return this;
    }

    const filtered = handlers.filter((handler) => handler.listener !== listener);
    if (!Object.keys(filtered).length) {
        delete this._events[type];
    }
    else {
        this._events[type] = filtered;
    }

    return this;
};


internals.Podium.prototype.removeAllListeners = function (type) {

    delete this._events[type];
    return this;
};


internals.Podium.prototype._removeHandler = function (type, handler) {

    const handlers = this._events[type];
    const filtered = handlers.filter((item) => item !== handler);
    if (!Object.keys(filtered).length) {
        delete this._events[type];
    }
    else {
        this._events[type] = filtered;
    }
};
