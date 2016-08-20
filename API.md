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

## `podium.registerEvent(events)`

## `podium.registerPodium(podiums)`

## `podium.emit(criteria, data, [callback])`

## `podium.on(criteria, listener)`

Subscribe a handler to an event where:
- `criteria` - the subscription criteria which must be one of:
    - event name string.
    - a criteria object with the following optional keys (unless noted otherwise):
        - `name` - the event name (required).
        - `block` - if `true`, the `listener` method receives an additional `callback` argument
          which must be called when the method completes. No other event will be emitted until the
          `callback` methods is called. The method signature is `function()`. If `block` is set to
          a positive integer, the value is used to set a timeout after which any pending events
          will be emitted, ignoring the eventual call to `callback`. Defaults to `false` (non
          blocking).
        - `channels` - a string or array of strings specifying the event channels to subscribe to.
          If the event registration specified a list of allowed channels, the `channels` array must
          match the allowed channels. If `channels` are specified, event updates without any
          channel designation will not be included in the subscription. Defaults to no channels
          filter.
        - `clone` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
           is cloned before it is passed to the `listener` method. Defaults to the event
           registration option (which defaults to `false`).
        - `count` - a positive integer indicating the number of times the `listener` can be called
          afterwhich the subscription is automatically removed. A count of `1` is the same as
          calling `podium.once()`. Defaults to no limit.
        - `filter` - the event tags (if present) to subscribe to which can be one of:
            - a tag string.
            - an array of tag strings.
            - an object with the following:
                - `tags` - a tag string or array of tag strings.
                - `all` - if `true`, all `tags` must be present for the event update to match the
                  subscription. Defaults to `false` (at least one matching tag).
        - `spread` - if `true`, the `data` object passed to [`podium.emit()`](#podiumemitcriteria-data-callback)
        - `tags` -
- `listener` - the handler method set to receive event updates. The function signature depends
  on the `block`, `spread`, and `tags` options.

## `podium.addListener(criteria, listener)`

Same as [`podium.on()`](#podiumoncriteria-listener).

## `podium.once(criteria, listener)`

Same as calling [`podium.on()`](#podiumoncriteria-listener) with the `count` option set to `1`.

## `podium.removeListener(name, listener)`

Removes all listeners subscribed to a given event name matching the provided listener method where:
- `name` - the event name string.
- `listener` - the function reference provided when subscribed.

Returns a reference to the currnet emitter.

## `podium.removeAllListeners(name)`

Removes all listeners subscribed to a given event name where:
- `name` - the event name string.

Returns a reference to the currnet emitter.

## `podium.hasListeners(name)`

Returns whether an event has any listeners subscribed where:
- `name` - the event name string.

Returns `true` if the event name has any listeners, otherwise `false`.
