//const NodeCache = require('node-cache');
//
///** 
// * @file Create a cache service for the API based on the node-cache library
// */
//
///** A cache service based on the node-cache library*/
//class Cache {
//
//    /**
//     * Callback function for cache service
//     * @callback cacheCallback
//     * @param {err} error - error returned on failure 
//     * @param {*} value - value returned on success 
//     */
//
//    /**
//     * Create a cache instance.
//     * @param {number} ttlSeconds - The time to live value in Seconds.
//     * @param {number} maxMemoryMb - The memory allocated for the cache in Mbytes.
//     */
//    constructor(ttlSeconds, maxMemoryMb) {
//        this.cache = new NodeCache({
//            stdTTL: ttlSeconds,
//            checkPeriod: ttlSeconds * 0.2
//        });
//        this.maxMemory = maxMemoryMb * 1000000;
//    }
//
//    /**
//     * Gets a cached value from a key.
//     * @param {string|number} key - The key
//     * @return {string|json|array} Value linked to the key
//     */
//    get(key) {
//        return (this.cache.get(key));
//    }
//
//    /**
//     * Sets a key value pair a cached value from a key if memory isn't full.
//     * @param {string|number} key - The key
//     * @param {string|json|array} value - The value to cache
//     * @return {bool} true on success
//     */
//    set(key, value) {
//        if (this.cache.getStats().vsize + this.cache.getStats().ksize < this.maxMemory) {
//            return (this.cache.set(key, value));
//        } else {
//            console.log('cache full');
//            return (false);
//        }
//    }
//
//    /**
//     * Deletes a key
//     * @param {string|number|array} keys - The keys to delete
//     * @return {number} the number of deleted entries
//     */
//    del(keys) {
//        return (this.cache.del(keys));
//    }
//
//    /**
//     * Deletes all cached data
//     */
//    flush() {
//        this.cache.flushAll();
//    }
//
//    /**
//     * Returns the statistics.
//     */
//    getStats() {
//        return (this.cache.getStats());
//    }
//
//
//    /**
//     * Returns the list of keys contained in the cache.
//     * @param {cacheCallback} [callback] - A callback function
//     * @return {array} The list of keys contained in the cache
//     */
//
//    keys(callback) {
//        if (typeof callback === 'function') {
//            return (this.cache.keys(callback)); //async with a callback function(err, mykeys)
//        } else {
//            return (this.cache.keys()); //sync
//        }
//    }
//}
//module.exports = Cache;


/**
 * based on cacheman-file library.
 * Sligthly modified for our use.
 */

const {
    timer
} = require('rxjs');
const Fs = require('fs-extra');
const sanitize = require('sanitize-filename');
const Path = require('path');
const Noop = function() {};

/**
 * FileStore constructor
 * @param {Object} options
 * @param {String} options.tmpDir
 * @api public
 */
function FileStore(options) {
    var self = this;
    if (options.ttl !== 'undefined') {
        self.ttl = options.ttl;
    }
    if (options.checkPeriod !== 'undefined') {
        self.checkPeriod = options.checkPeriod;
    }

    self.tmpDir = options.tmpDir || Path.join(process.cwd(), 'tmp');

    if (!Fs.existsSync(self.tmpDir)) Fs.mkdirSync(self.tmpDir);

    var cacheFiles = Fs.readdirSync(self.tmpDir);
    self.cache = {};
    cacheFiles.forEach(function(file) {
        file = file.replace('.json', '');
        self.cache[file] = true;
    });

    self.delExpired();
}

/**
 * Get entry
 * @param {String} key
 * @param {Function} fn
 * @api public
 */
FileStore.prototype.get = function get(key, fn) {
    var self = this;
    var val = null;
    var data = null;
    key = sanitize(key);
    var cacheFile = Path.join(self.tmpDir, key + '.json');

    fn = fn || Noop;

    if (Fs.existsSync(cacheFile)) {
        data = Fs.readFileSync(cacheFile);
        data = JSON.parse(data);
    } else {
        return fn(null, null);
    }

    if (!self.cache[key]) {
        return fn(null, null);
    }

    if (!data) return fn(null, data);
    if (data.expire < Date.now()) {
        self.del(key);
        return fn(null, data);
    }

    try {
        val = JSON.parse(data.value);
    } catch (e) {
        return fn(e);
    }

    process.nextTick(function tick() {
        fn(null, val);
    });
};

/**
 * Set an entry.
 * @param {String} key
 * @param {Mixed} val
 * @param {Number} ttl
 * @param {Function} fn
 * @api public
 */
FileStore.prototype.set = function set(key, val, ttl, fn) {
    var data, self = this;

    if (typeof val === 'undefined' || null) return fn(new Error('val not set'));
    if (typeof ttl === 'function') fn = ttl;
    fn = fn || Noop;
    if (typeof ttl === 'undefined') {
        ttl = self.ttl
    }
    ttl = ttl * 1000;

    try {
        data = {
            value: JSON.stringify(val),
            expire: JSON.stringify(Date.now() + ttl)
        };
    } catch (e) {
        return fn(e);
    }

    key = sanitize(key);
    var cacheFile = Path.join(self.tmpDir, key + '.json');

    Fs.writeFileSync(cacheFile, JSON.stringify(data, null, 4));

    process.nextTick(function tick() {
        self.cache[key] = data.expire;
        fn(null, val);
    });
};

/**
 * Delete an entry.
 * @param {String} key
 * @param {Function} fn
 * @api public
 */
FileStore.prototype.del = function del(key, fn) {
    var self = this;
    key = sanitize(key);
    var cacheFile = Path.join(self.tmpDir, key + '.json');

    fn = fn || Noop;

    if (!Fs.existsSync(cacheFile)) {
        self.cache[key] = null;
        return fn();
    }

    try {
        Fs.removeSync(cacheFile);
    } catch (e) {
        return fn(e);
    }

    process.nextTick(function tick() {
        self.cache[key] = null;
        fn(null);
    });
};

/**
 * Clear all cached files
 * @param {String} key
 * @param {Function} fn
 * @api public
 */
FileStore.prototype.clear = function clear(key, fn) {
    var self = this;

    if ('function' === typeof key) {
        fn = key;
        key = null;
    }

    fn = fn || Noop;

    try {
        Fs.removeSync(self.tmpDir);
        Fs.mkdirSync(self.tmpDir);
    } catch (e) {
        return fn(e);
    }

    process.nextTick(function tick() {
        self.cache = {};
        fn(null);
    });
};

/**
 * Get all cached entries
 * @param {Function} fn
 */
FileStore.prototype.getAll = function(fn) {
    var self = this;
    var entries = [],
        cache = self.cache;

    Object.keys(cache).forEach(function(entry) {
        self.get(entry, function(err, result) {
            if (err) return fn(err);
            entries.push(result);
        });
    });

    process.nextTick(function() {
        fn(null, entries);
    });
};

/**
 * delete all expired keys, internally used to update the valid keys
 */
FileStore.prototype.delExpired = function() {
    var self = this;
    var cache = self.cache;

    Object.keys(cache).forEach(function(entry) {
        var data = null;
        key = sanitize(entry);
        var cacheFile = Path.join(self.tmpDir, key + '.json');

        if (Fs.existsSync(cacheFile)) {
            data = Fs.readFileSync(cacheFile);
            data = JSON.parse(data);
        } else {
            return;
        }

        if (!self.cache[key]) {
            return;
        }

        if (data.expire < Date.now()) {
            self.del(key);
            return;
        }
    });

    setTimeout(() => {
        self.delExpired()
    }, (this.checkPeriod * 1000));


};


module.exports = FileStore;