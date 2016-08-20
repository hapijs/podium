#podium

Node (semi) compatible event emitter with extra features.

**podium** is an event emitter with support for tags, filters, channels, event update cloning,
arguments spreading, and other features useful when building large scale applications. While node's
native [`EventEmitter`](https://nodejs.org/dist/latest-v6.x/docs/api/events.html#events_class_eventemitter)
is strictly focused on maximum performance, it lacks many features that do not belong in the core
implementation. **podium** is not restricted by node's performance requirement as it is designed for
application layer needs where it's overhead is largely insignificant as implementing these features
will have similar cost on top of the native emitter.

[![Build Status](https://secure.travis-ci.org/hapijs/podium.svg)](http://travis-ci.org/hapijs/podium)

Lead Maintainer - [Eran Hammer](https://github.com/hueniverse)

## API

The full API is available in the [API documentation](https://github.com/hapijs/podium/blob/master/API.md).

