const NodeCache = require('node-cache');

/** Class representing a cache service for the api. */
class Cache {

    /**
     * Create a cache instance.
     * @param {number} ttlSeconds - The time to live value in Seconds.
     * @param {number} maxMemoryMb - The memory allocated for the cache in Mbytes.
     */
    constructor(ttlSeconds, maxMemoryMb) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2
        });
        this.maxMemory = maxMemoryMb * 1000000;
    }

    /**
     * Gets a cached value from a key.
     * @param {string} key - The key
     * @return {undefined} If not found or expired
     * @return {stored value type} Value linked to the key
     */
    get(key) {
        return (this.cache.get(key));
    }

    /**
     * Sets a key value pair a cached value from a key if memory isn't full.
     * @param {key Type} key - The key
     * @param {element Type} value - The value to cache
     * @return {bool} true on success
     */
    set(key, value) {
        if (this.cache.getStats().vsize + this.cache.getStats().ksize < this.maxMemory) {
            return (this.cache.set(key, value));
        } else {
            console.log('cache full');
            return (false);
        }
    }

    /**
     * Deletes a key
     * @param {key Type} key - The key to delete
     * @return {number} the number of deleted entries
     */
    del(keys) {
        return (this.cache.del(keys));
    }

    /**
     * Deletes all cached data
     */
    flush() {
        this.cache.flushAll();
    }

    /**
     * Returns the statistics.
     */
    getStats() {
        return (this.cache.getStats());
    }

    keys(fn) {
        if (typeof fn === 'function') {
            return (this.cache.keys(fn)); //async with a callback function(err, mykeys)
        } else {
            return (this.cache.keys()); //sync
        }
    }
}
module.exports = Cache;