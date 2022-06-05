"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSEBroadcasterRedisAdapter = void 0;
var assert = require('assert'), inherits = require('util').inherits, EventEmitter = require('events'), Broadcaster = require('sse-broadcast'), id = require('mdbid');
const redis_1 = __importDefault(require("redis"));
const SSEBroadcasterRedisAdapter = (broadcaster, optionsOrClient) => {
    if (!this || !(this instanceof exports.SSEBroadcasterRedisAdapter)) {
        return new exports.SSEBroadcasterRedisAdapter(broadcaster, optionsOrClient);
    }
    assert(broadcaster, 'a broadcaster instance is required');
    assert(broadcaster instanceof Broadcaster, 'broadcaster must be an instance of SSEBroadcaster')(this).id = id()(this).broadcaster = broadcaster;
    if (optionsOrClient.ECHO) {
        this.pub = optionsOrClient;
        this.sub = optionsOrClient.duplicate();
    }
    else {
        this.pub = redis_1.default.createClient(optionsOrClient);
        this.sub = redis_1.default.createClient(optionsOrClient);
    }
    broadcaster.on('publish', this.onpublish.bind(this));
    broadcaster.on('subscribe', this.onsubscribe.bind(this));
    broadcaster.on('unsubscribe', this.onunsubscribe.bind(this))(this).pub.on('error', this.onerror.bind(this))(this).sub.on('error', this.onerror.bind(this))(this).sub.on('pmessage', this.onpmessage.bind(this));
};
exports.SSEBroadcasterRedisAdapter = SSEBroadcasterRedisAdapter;
inherits(exports.SSEBroadcasterRedisAdapter, EventEmitter);
Object.defineProperties(exports, {
    Adapter: {
        enumerable: true,
        value: exports.SSEBroadcasterRedisAdapter
    },
    version: {
        enumerable: true,
        get: function () {
            return require('./package.json').version;
        }
    }
});
exports.SSEBroadcasterRedisAdapter.prototype.onerror = function onerror(err) {
    this.emit('error', err);
};
exports.SSEBroadcasterRedisAdapter.prototype.onpmessage = function onpmessage(pattern, channel, message) {
    var id = channel.substring(0, 24);
    if (this.id === id) {
        return;
    }
    message = JSON.parse(message);
    message.emit = false;
    this.broadcaster.publish(channel.substring(30), message);
};
exports.SSEBroadcasterRedisAdapter.prototype.onpublish = function onpublish(name, message) {
    this.pub.publish(this.id + ':sseb:' + name, JSON.stringify(message));
};
exports.SSEBroadcasterRedisAdapter.prototype.onsubscribe = function onsubscribe(name) {
    this.sub.psubscribe('*:sseb:' + name);
};
exports.SSEBroadcasterRedisAdapter.prototype.onunsubscribe = function onunsubscribe(name) {
    if (!this.broadcaster.subscriberCount(name))
        this.sub.punsubscribe('*:sseb:' + name);
};
exports.SSEBroadcasterRedisAdapter.prototype.quit = function quit() {
    this.pub.quit();
    this.sub.quit();
};
exports.SSEBroadcasterRedisAdapter.prototype.unref = function unref() {
    this.pub.unref();
    this.sub.unref();
};
exports.SSEBroadcasterRedisAdapter.prototype.end = function end(flush) {
    this.pub.end(flush);
    this.sub.end(flush);
};
