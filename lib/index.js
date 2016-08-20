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
        this.registerEvent(events);
    }
};


internals.Podium.prototype.registerEvent = function (events) {

    events = Hoek.flatten([].concat(events));
    events.forEach((event) => {

        if (!event) {
            return;
        }

        if (event instanceof internals.Podium) {
            return this.registerPodium(event);
        }

        if (typeof event === 'string') {
            event = { name: event };
        }

        const name = event.name;
        Hoek.assert(name, 'Missing event name');
        Hoek.assert(!this._eventListeners[name], `Event ${event} exists`);

        this._eventListeners[name] = { handlers: null, flags: event };
        this._podiums.forEach((podium) => {

            if (!podium._eventListeners[name]) {
                podium._eventListeners[name] = { handlers: null, flags: event };
            }
        });
    });
};


internals.Podium.prototype.registerPodium = function (podiums) {

    [].concat(podiums).forEach((podium) => {

        if (podium._podiums.indexOf(this) !== -1) {
            return;
        }

        podium._podiums.push(this);
        Object.keys(podium._eventListeners).forEach((name) => {

            if (!this._eventListeners[name]) {
                this._eventListeners[name] = { handlers: null, flags: podium._eventListeners[name].flags };
            }
        });
    });
};


internals.Podium.prototype.emit = function (criteria, data, callback) {

    callback = callback || Hoek.ignore;
    criteria = internals.criteria(criteria);

    const name = criteria.name;
    Hoek.assert(name, 'Criteria missing event name');

    const event = this._eventListeners[name];
    Hoek.assert(event, `Unknown event ${name}`);
    Hoek.assert(!event.flags.spread || Array.isArray(data), 'Data must be an array for spread event');

    internals.emit(this, internals.distribute(this, { criteria, data, callback }));
};


internals.distribute = function (emitter, notification) {

    if (!emitter._podiums.length) {
        return notification;
    }

    const criteria = notification.criteria;
    const data = notification.data;
    const finalize = notification.callback;

    const callback = function () {

        const each = (podium, next) => podium.emit(criteria, data, next);
        Items.parallel(emitter._podiums.slice(), each, finalize);
    };

    return { criteria, data, callback };
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

        const event = emitter._eventListeners[item.criteria.name];
        const handlers = event.handlers;
        if (!handlers) {
            item.callback();
            return next();
        }

        const eachHandler = (handler, nextHandler) => {

            if (handler.count) {
                --handler.count;
                if (handler.count < 1) {
                    internals.removeHandler(emitter, item.criteria.name, handler);
                }
            }

            const invoke = (func) => {

                const data = (handler.clone || event.flags.clone ? Hoek.clone(item.data) : item.data);
                const args = (event.flags.spread ? data : [data]);
                if (func) {
                    args.push(func);
                }

                handler.listener.apply(null, args);
            };

            if (!handler.block) {
                invoke();
                return nextHandler();
            }

            let timer = null;
            if (handler.block !== true) {
                nextHandler = Hoek.once(nextHandler);
                timer = setTimeout(nextHandler, handler.block);
            }

            invoke(() => {

                clearTimeout(timer);
                return nextHandler();
            });
        };

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


internals.Podium.prototype.on = internals.Podium.prototype.addListener = function (criteria, options, listener) {

    if (typeof options === 'function') {
        listener = options;
        options = {};
    }

    criteria = internals.criteria(criteria);
    options = Object.assign({}, options, { listener });

    const name = criteria.name;
    Hoek.assert(name, 'Criteria missing event name');
    Hoek.assert(this._eventListeners[name], `Unknown event ${name}`);
    Hoek.assert(typeof options.listener === 'function', `Listener must be a function for ${name}`);
    Hoek.assert(options.count === undefined || options.count > 0, `Invalid listener count option for ${name}`);
    Hoek.assert(options.block === undefined || options.block === true || Hoek.isInteger(options.block), `Invalid block option value for ${name}`);

    this._eventListeners[name].handlers = this._eventListeners[name].handlers || [];
    this._eventListeners[name].handlers.push(options);

    return this;
};


internals.Podium.prototype.once = function (criteria, options, listener) {

    if (typeof options === 'function') {
        listener = options;
        options = {};
    }

    return this.on(criteria, Object.assign({}, options, { count: 1 }), listener);
};


internals.Podium.prototype.removeListener = function (criteria, listener) {

    criteria = internals.criteria(criteria);

    const name = criteria.name;
    Hoek.assert(this._eventListeners[name], `Unknown event ${name}`);
    Hoek.assert(typeof listener === 'function', 'Listener must be a function');

    const handlers = this._eventListeners[name].handlers;
    if (!handlers) {
        return this;
    }

    const filtered = handlers.filter((handler) => handler.listener !== listener);
    this._eventListeners[name].handlers = (filtered.length ? filtered : null);
    return this;
};


internals.Podium.prototype.removeAllListeners = function (criteria) {

    criteria = internals.criteria(criteria);

    const name = criteria.name;
    Hoek.assert(this._eventListeners[name], `Unknown event ${name}`);

    this._eventListeners[name].handlers = null;
    return this;
};


internals.Podium.prototype.hasListeners = function (criteria) {

    criteria = internals.criteria(criteria);

    const name = criteria.name;
    Hoek.assert(this._eventListeners[name], `Unknown event ${name}`);
    return !!this._eventListeners[name].handlers;
};


internals.removeHandler = function (emitter, name, handler) {

    const handlers = emitter._eventListeners[name].handlers;
    const filtered = handlers.filter((item) => item !== handler);
    emitter._eventListeners[name].handlers = (filtered.length ? filtered : null);
};


internals.criteria = function (criteria) {

    return (typeof criteria === 'string' ? { name: criteria } : criteria);
};
