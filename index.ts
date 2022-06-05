var assert = require('assert'),
    inherits = require('util').inherits,
    EventEmitter = require('events'),
    Broadcaster = require('sse-broadcast'),
    id = require('mdbid')

import redis, { RedisClientOptions, RedisClientType } from 'redis'

export const SSEBroadcasterRedisAdapter = (broadcaster, optionsOrClient: RedisClientOptions | RedisClientType): void => {
    if (!this || !((this as any) instanceof SSEBroadcasterRedisAdapter)) {
        return new SSEBroadcasterRedisAdapter(broadcaster, optionsOrClient)
    }

    assert(broadcaster, 'a broadcaster instance is required')
    assert(
        broadcaster instanceof Broadcaster,
        'broadcaster must be an instance of SSEBroadcaster'
    )

        (this as any).id = id()
            (this as any).broadcaster = broadcaster

    if ((optionsOrClient as RedisClientType).ECHO) {
        (this as any).pub = optionsOrClient as RedisClientType
        (this as any).sub = (optionsOrClient as RedisClientType).duplicate()
    } else {
        (this as any).pub = redis.createClient(optionsOrClient as RedisClientOptions) as any
        (this as any).sub = redis.createClient(optionsOrClient as RedisClientOptions)
    }

    broadcaster.on('publish', (this as any).onpublish.bind(this))
    broadcaster.on('subscribe', (this as any).onsubscribe.bind(this))
    broadcaster.on('unsubscribe', (this as any).onunsubscribe.bind(this))

        (this as any).pub.on('error', (this as any).onerror.bind(this))
        (this as any).sub.on('error', (this as any).onerror.bind(this))
        (this as any).sub.on('pmessage', (this as any).onpmessage.bind(this))
}

inherits(SSEBroadcasterRedisAdapter, EventEmitter)

// static properties
Object.defineProperties(exports, {
    Adapter: {
        enumerable: true,
        value: SSEBroadcasterRedisAdapter
    },

    version: {
        enumerable: true,
        get: function () {
            return require('./package.json').version
        }
    }
})

SSEBroadcasterRedisAdapter.prototype.onerror = function onerror(err) {
    this.emit('error', err)
}

SSEBroadcasterRedisAdapter.prototype.onpmessage = function onpmessage(pattern, channel, message) {
    var id = channel.substring(0, 24)

    // we've got back our own message
    if (this.id === id) {
        return
    }

    message = JSON.parse(message)
    // do not re-emit this publish
    // (and start an infinite ping-pong match)
    message.emit = false
    this.broadcaster.publish(channel.substring(30), message)
}

SSEBroadcasterRedisAdapter.prototype.onpublish = function onpublish(name, message) {
    this.pub.publish(this.id + ':sseb:' + name, JSON.stringify(message))
}

SSEBroadcasterRedisAdapter.prototype.onsubscribe = function onsubscribe(name) {
    this.sub.psubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.onunsubscribe = function onunsubscribe(name) {
    if (!this.broadcaster.subscriberCount(name))
        this.sub.punsubscribe('*:sseb:' + name)
}

SSEBroadcasterRedisAdapter.prototype.quit = function quit() {
    this.pub.quit()
    this.sub.quit()
}

SSEBroadcasterRedisAdapter.prototype.unref = function unref() {
    this.pub.unref()
    this.sub.unref()
}

SSEBroadcasterRedisAdapter.prototype.end = function end(flush) {
    this.pub.end(flush)
    this.sub.end(flush)
}
