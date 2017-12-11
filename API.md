# 1.0.x API Reference

- [`new Podium(events)`](#podiumnew-podiumevents)
- [`podium.registerEvent(events)`](#podiumregistereventevents)
- [`podium.registerPodium(podiums)`](#podiumregisterpodiumpodiums)
- [`podium.emit(criteria, data, [callback])`](#podiumemitcriteria-data-callback)
- [`podium.on(criteria, listener)`](#podiumoncriteria-listener)
- [`podium.addListener(criteria, listener)`](#podiumaddlistenercriteria-listener)
- [`podium.once(criteria, listener)`](#podiumoncecriteria-listener)
- [`podium.removeListener(name, listener)`](#podiumremoveListenername-listener)
- [`podium.removeAllListeners(name)`](#podiumremoveAllListenersname)
- [`podium.hasListeners(name)`](#podiumhasListenersname)


## `new Podium(events)`

Creates a new **podium** emitter where:
- `events` - if present, the value is passed to [`podium.registerEvent()`](#podiumregistereventevents).

Returns a `Podium` object.

## `podium.registerEvent(events)`

Register the specified events and their optional configuration. Events must be registered before
they can be emitted or subscribed to. This is done to detect event name mispelling and invalid
event activities. The `events` argument can be:
- an event **string**.
- an event options object with the following optional keys (unless noted otherwise):
    - `name` - the event name **string (required)**.
    - `channels` - a **string** or **array of strings** specifying the event channels available. **Defaults
       to no channel restrictions (event updates can specify a channel or not).**
    - `clone` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        is cloned before it is passed to the listeners (unless an override specified by each listener).
        **Defaults to `false` (`data` is passed as-is).**
    - `spread` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        **must be an array** and the `listener` method is called with each array element passed as a separate
        argument (unless an override specified by each listener). **This should only be used when the emitted
        data structure is known and predictable.**
        **Defaults to `false` (`data` is emitted as a single argument regardless of its type).**
    - `tags` - if `true` and the `criteria` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        includes `tags`, the tags are mapped to an object (where each tag string is the key and
        the value is `true`) which is appended to the arguments list at the end (but before
        the `callback` argument if `block` is set). A configuration override can be set by each
        listener. **Defaults to `false`.**
    - `shared` - if `true`, the same event `name` can be registered multiple times where the second
      registration is ignored. **Note that if the registration config is changed between registrations,
      only the first configuration is used. Defaults to `false` (a duplicate registration will throw an
      error).**
- a `Podium` object which is passed to [`podium.registerPodium()`](#podiumregisterpodiumpodiums).
- an array containing any of the above.

## `podium.registerPodium(podiums)`

Registers another emitter as an event source for the current emitter (any event update emitted by the
source emitter is passed to any subscriber of the current emitter) where:
- `podiums` - a `Podium` object or an array of objects, each added as a source.

Note that any events registered with a source emitter are automatically added to the current emitter.
If the events are already registered, they are left as-is.

## `podium.emit(criteria, data, [callback])`

Emits an event update to all the subscribed listeners where:
- `criteria` - the event update criteria which must be one of:
    - the event name string.
    - an object with the following optional keys (unless noted otherwise):
        - `name` - the event name string (required).
        - `channel` - the channel name string.
        - `tags` - a tag string or array of tag strings.
- `data` - the value emitted to the subscribers.
- `callback` - an **optional** callback method invoked when all subscribers have been notified using the
  signature `function()`.

## `podium.on(criteria, listener)`

Subscribe a handler to an event where:
- `criteria` - the subscription criteria which must be one of the following:
    - event name **string**.
    - a criteria object with the following optional keys (unless noted otherwise):
        - `name` - the event name **string (required)**.
        - `block` - if `true`, the `listener` method receives an additional `callback` argument
          which must be called when the method completes. No other event will be emitted until the
          `callback` methods is called. The method signature is `function()`. If `block` is set to
          a positive integer, the value is used to set a timeout after which any pending events
          will be emitted, ignoring the eventual call to `callback`. **Defaults to `false` (non
          blocking).**
        - `channels` - a **string** or **array of strings** specifying the event channels to subscribe to.
          If the event registration specified a list of allowed channels, the `channels` array must
          match the allowed channels. If `channels` are specified, event updates without any
          channel designation will not be included in the subscription. **Defaults to no channels
          filter.**
        - `clone` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
           is cloned before it is passed to the `listener` method. **Defaults to the event
           registration option (which defaults to `false`).**
        - `count` - a positive **integer** indicating the number of times the `listener` can be called
          after which the subscription is automatically removed. A count of `1` is the same as
          calling `podium.once()`. **Defaults to no limit.**
        - `filter` - the event tags (if present) to subscribe to which can be one of the following:
            - a tag **string**.
            - an **array** of tag **strings**.
            - an object with the following:
                - `tags` - a tag **string** or **array** of tag **strings**.
                - `all` - if `true`, all `tags` must be present for the event update to match the
                  subscription. **Defaults to `false` (at least one matching tag).**
        - `spread` - if `true`, and the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
          is an **array**, the `listener` method is called with each **array element** passed as a separate
          argument. **This should only be used when the emitted data structure is known and predictable.
          Defaults to the event registration option (which defaults to `false`).**
        - `tags` - if `true` and the `criteria` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
          includes `tags`, the tags are mapped to an object (where each tag string is the key and
          the value is `true`) which is appended to the arguments list at the end (but before
          the `callback` argument if `block` is set). **Defaults to the event registration option
          (which defaults to `false`).**
- `listener` - the handler method set to receive event updates. The function signature depends
  on the `block`, `spread`, and `tags` options.

## `podium.addListener(criteria, listener)`

Same as [`podium.on()`](#podiumoncriteria-listener).

## `podium.once(criteria, listener)`

Same as calling [`podium.on()`](#podiumoncriteria-listener) with the `count` option set to `1`.

## `podium.removeListener(name, listener)`

Removes all listeners subscribed to a given event name matching the provided listener method where:
- `name` - the event name **string**.
- `listener` - the function reference provided when subscribed.

Returns a reference to the current emitter.

## `podium.removeAllListeners(name)`

Removes all listeners subscribed to a given event name where:
- `name` - the event name **string**.

Returns a reference to the current emitter.

## `podium.hasListeners(name)`

Returns whether an event has any listeners subscribed where:
- `name` - the event name **string**.

Returns `true` if the event name has any listeners, otherwise `false`.
