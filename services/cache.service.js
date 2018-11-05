const NodeCache = require('node-cache');

/** 
 * @file Create a cache service for the API based on the node-cache library
 */

/** A cache service based on the node-cache library*/
class Cache {

    /**
     * Callback function for cache service
     * @callback cacheCallback
     * @param {err} error - error returned on failure 
     * @param {*} value - value returned on success 
     */

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
     * @param {string|number} key - The key
     * @return {string|json|array} Value linked to the key
     */
    get(key) {
        return (this.cache.get(key));
    }

    /**
     * Sets a key value pair a cached value from a key if memory isn't full.
     * @param {string|number} key - The key
     * @param {string|json|array} value - The value to cache
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
     * @param {string|number|array} keys - The keys to delete
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


    /**
     * Returns the list of keys contained in the cache.
     * @param {cacheCallback} [callback] - A callback function
     * @return {array} The list of keys contained in the cache
     */

    keys(callback) {
        if (typeof callback === 'function') {
            return (this.cache.keys(callback)); //async with a callback function(err, mykeys)
        } else {
            return (this.cache.keys()); //sync
        }
    }
}
module.exports = Cache;