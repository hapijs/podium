'use strict';

// Load modules

const Hoek = require('hoek');
const Items = require('items');


// Declare internals

const internals = {};


exports = module.exports = internals.Podium = function (events) {

    // Use descriptive names to avoid conflict when inherited

    this._eventListeners = Object.create(null);
    this._notificationsQueue = [];
    this._eventsProcessing = false;
    this._podiums = [];

    if (events) {
        [].concat(events).forEach((event) => {

            if (event instanceof internals.Podium) {
                return this.registerPodium(event);
            }

            Hoek.assert(!this._eventListeners[event], `Event ${event} exists`);

            if (typeof event === 'string') {
                event = { name: event };
            }

            this._eventListeners[event.name] = { subs: null, flags: event };
        });
    }
};


internals.Podium.prototype.registerPodium = function (podiums) {

    [].concat(podiums).forEach((podium) => {

        podium._podiums.push(this);
        Object.keys(podium._eventListeners).forEach((event) => {

            if (!this._eventListeners[event]) {
                this._eventListeners[event] = { subs: null, flags: podium._eventListeners[event].flags };
            }
        });
    });
};


internals.Podium.prototype.emit = function (event, data, callback) {

    callback = callback || Hoek.ignore;

    Hoek.assert(this._eventListeners[event], `Unknown event ${event}`);

    internals.emit(this, internals.distribute(this, { event, data, callback }));
};


internals.distribute = function (emitter, notification) {

    if (!emitter._podiums.length) {
        return notification;
    }

    const chain = function () {

        const each = (podium, next) => podium.emit(notification.event, notification.data, next);
        Items.parallel(emitter._podiums, each, notification.callback);
    };

    return { event: notification.event, data: notification.data, callback: chain };
};


internals.emit = function (emitter, notification) {

    if (notification) {
        emitter._notificationsQueue.push(notification);
    }

    if (emitter._eventsProcessing ||
        !emitter._notificationsQueue.length) {

        return;
    }

    emitter._eventsProcessing = true;
    const queue = emitter._notificationsQueue;
    emitter._notificationsQueue = [];

    const each = (item, next) => {

        const event = emitter._eventListeners[item.event];
        const eachHandler = (handler, nextHandler) => {

            if (handler.count) {
                --handler.count;
                if (handler.count < 1) {
                    internals.removeHandler(emitter, item.event, handler);
                }
            }

            setImmediate(() => {

                const data = (handler.clone || event.flags.clone ? Hoek.clone(item.data) : item.data);

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

        const handlers = event.subs;
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

        emitter._eventsProcessing = false;
        return internals.emit(emitter);
    });
};


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (event, options, listener) {

    if (typeof options === 'function') {
        listener = options;
        options = {};
    }

    options = Object.assign({}, options, { listener });

    Hoek.assert(this._eventListeners[event], `Unknown event ${event}`);
    Hoek.assert(typeof options.listener === 'function', `Listener must be a function for ${event}`);
    Hoek.assert(options.count === undefined || options.count > 0, `Invalid listener count option for ${event}`);
    Hoek.assert(options.block === undefined || options.block === true || Hoek.isInteger(options.block), `Invalid block option value for ${event}`);

    this._eventListeners[event].subs = this._eventListeners[event].subs || [];
    this._eventListeners[event].subs.push(options);

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

    Hoek.assert(this._eventListeners[event], `Unknown event ${event}`);
    Hoek.assert(typeof listener === 'function', 'Listener must be a function');

    const handlers = this._eventListeners[event].subs;
    if (!handlers) {
        return this;
    }

    const filtered = handlers.filter((handler) => handler.listener !== listener);
    this._eventListeners[event].subs = (filtered.length ? filtered : null);
    return this;
};


internals.Podium.prototype.removeAllListeners = function (event) {

    Hoek.assert(this._eventListeners[event], `Unknown event ${event}`);

    this._eventListeners[event].subs = null;
    return this;
};


internals.removeHandler = function (emitter, event, handler) {

    const handlers = emitter._eventListeners[event].subs;
    const filtered = handlers.filter((item) => item !== handler);
    emitter._eventListeners[event].subs = (filtered.length ? filtered : null);
};
