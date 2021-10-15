'use strict';

const Hoek = require('@hapi/hoek');
const Teamwork = require('@hapi/teamwork');
const Validate = require('@hapi/validate');


const internals = {
    schema: {
        base: Validate.object({
            name: Validate.string().required(),
            clone: Validate.boolean(),
            tags: Validate.boolean(),
            spread: Validate.boolean(),
            channels: Validate.array().items(Validate.string()).single().unique().min(1)
        })
    }
};


internals.schema.event = internals.schema.base.keys({
    shared: Validate.boolean()
});


internals.schema.listener = internals.schema.event.keys({
    listener: Validate.func().required(),
    context: Validate.object(),
    count: Validate.number().integer().min(1),
    filter: {
        tags: Validate.array().items(Validate.string()).single().unique().min(1).required(),
        all: Validate.boolean()
    }
});


exports.validate = function (events) {

    const normalized = [];
    events = [].concat(events);
    for (let event of events) {
        if (typeof event === 'string') {
            event = { name: event };
        }

        normalized.push(Validate.attempt(event, internals.schema.event, 'Invalid event options'));
    }

    return normalized;
};


exports.Podium = class {

    static decorate(target, source) {

        for (const [name, entry] of source.#listeners.entries()) {
            target.#listeners.set(name, {
                handlers: null,
                flags: entry.flags
            });
        }
    }

    #listeners = new Map();

    constructor(events, options) {

        if (events) {
            this.registerEvent(events, options);
        }
    }

    registerEvent(events, options) {

        events = [].concat(events);
        for (let event of events) {
            if (typeof event === 'string') {
                event = { name: event };
            }

            if (options?.validate !== false) {                                                       // Defaults to true
                event = Validate.attempt(event, internals.schema.event, 'Invalid event options');
            }

            const name = event.name;
            if (this.#listeners.has(name)) {
                Hoek.assert(event.shared, `Event ${name} exists`);
                continue;
            }

            this.#listeners.set(name, { handlers: null, flags: event });
        }
    }

    emit(criteria, data) {

        criteria = internals.criteria(criteria);

        const name = criteria.name;
        Hoek.assert(name, 'Criteria missing event name');

        const event = this.#listeners.get(name);
        Hoek.assert(event, `Unknown event ${name}`);

        if (!event.handlers) {
            return;
        }

        Hoek.assert(!criteria.channel || typeof criteria.channel === 'string', 'Invalid channel name');
        Hoek.assert(!criteria.channel || !event.flags.channels || event.flags.channels.indexOf(criteria.channel) !== -1, `Unknown ${criteria.channel} channel`);
        Hoek.assert(!event.flags.spread || Array.isArray(data) || typeof data === 'function', 'Data must be an array for spread event');

        if (typeof criteria.tags === 'string') {
            criteria = { ...criteria };
            criteria.tags = { [criteria.tags]: true };
        }

        if (criteria.tags &&
            Array.isArray(criteria.tags)) {

            // Map array to object

            const tags = {};
            for (const tag of criteria.tags) {
                tags[tag] = true;
            }

            criteria = { ...criteria };
            criteria.tags = tags;
        }

        let generated = false;
        let thrownErr;

        const handlers = event.handlers.slice();                // Clone in case handlers are changed by listeners
        for (const handler of handlers) {
            if (handler.channels &&
                (!criteria.channel || handler.channels.indexOf(criteria.channel) === -1)) {

                continue;
            }

            if (handler.filter) {
                if (!criteria.tags) {
                    continue;
                }

                const match = Hoek.intersect(criteria.tags, handler.filter.tags, { first: !handler.filter.all });
                if (!match ||
                    handler.filter.all && match.length !== handler.filter.tags.length) {

                    continue;
                }
            }

            if (handler.count) {
                --handler.count;
                if (handler.count < 1) {
                    this.#removeHandler(criteria.name, handler);
                }
            }

            if (!generated &&
                typeof data === 'function') {

                data = data();
                generated = true;
            }

            const update = internals.flag('clone', handler, event) ? Hoek.clone(data) : data;
            const args = internals.flag('spread', handler, event) && Array.isArray(update) ? update.slice(0) : [update];

            if (internals.flag('tags', handler, event) &&
                criteria.tags) {

                args.push(criteria.tags);
            }

            // Call the listener

            try {
                if (handler.context) {
                    handler.listener.apply(handler.context, args);
                }
                else {
                    handler.listener(...args);
                }
            }
            catch (err) {
                thrownErr = thrownErr ?? err;
            }
        }

        if (thrownErr) {
            throw thrownErr;
        }
    }

    addListener(criteria, listener, context) {

        criteria = internals.criteria(criteria);
        criteria.listener = listener;
        criteria.context = context;

        if (criteria.filter &&
            (typeof criteria.filter === 'string' || Array.isArray(criteria.filter))) {

            criteria = { ...criteria };
            criteria.filter = { tags: criteria.filter };
        }

        criteria = Validate.attempt(criteria, internals.schema.listener, 'Invalid event listener options');

        const name = criteria.name;
        const event = this.#listeners.get(name);
        Hoek.assert(event, `Unknown event ${name}`);
        Hoek.assert(!criteria.channels || !event.flags.channels || Hoek.intersect(event.flags.channels, criteria.channels).length === criteria.channels.length, `Unknown event channels ${criteria.channels && criteria.channels.join(', ')}`);

        event.handlers = event.handlers ?? [];
        event.handlers.push(criteria);

        return this;
    }

    on(criteria, listener, context) {

        return this.addListener(criteria, listener, context);
    }

    once(criteria, listener, context) {

        criteria = { ...internals.criteria(criteria), count: 1 };

        if (listener) {
            return this.addListener(criteria, listener, context);
        }

        return new Promise((resolve) => {

            this.addListener(criteria, (...args) => resolve(args));
        });
    }

    few(criteria, context) {

        Hoek.assert(typeof criteria === 'object', 'Criteria must be an object');
        Hoek.assert(criteria.count, 'Criteria must include a count limit');

        const team = new Teamwork.Team({ meetings: criteria.count });
        this.addListener(criteria, (...args) => team.attend(args), context);
        return team.work;
    }

    removeListener(name, listener) {

        Hoek.assert(this.#listeners.has(name), `Unknown event ${name}`);
        Hoek.assert(typeof listener === 'function', 'Listener must be a function');

        const event = this.#listeners.get(name);
        const handlers = event.handlers;
        if (!handlers) {
            return this;
        }

        const filtered = handlers.filter((handler) => handler.listener !== listener);
        event.handlers = filtered.length ? filtered : null;
        return this;
    }

    removeAllListeners(name) {

        Hoek.assert(this.#listeners.has(name), `Unknown event ${name}`);
        this.#listeners.get(name).handlers = null;
        return this;
    }

    hasListeners(name) {

        Hoek.assert(this.#listeners.has(name), `Unknown event ${name}`);
        return !!this.#listeners.get(name).handlers;
    }

    #removeHandler(name, handler) {

        const event = this.#listeners.get(name);
        const handlers = event.handlers;
        const filtered = handlers.filter((item) => item !== handler);
        event.handlers = filtered.length ? filtered : null;
    }
};


exports.decorate = exports.Podium.decorate;


internals.criteria = function (criteria) {

    if (typeof criteria === 'string') {
        return { name: criteria };
    }

    return criteria;
};


internals.flag = function (name, handler, event) {

    return handler[name] ?? event.flags[name] ?? false;
};
