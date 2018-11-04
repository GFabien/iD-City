const NodeCache = require('node-cache');

/** Class representing a cache service for the api. */
class Cache {

    /**
     * Create a cache instance.
     * @param {number} ttlSeconds - The time to live value in Seconds.
     */
    constructor(ttlSeconds) {
        this.cache = new NodeCache({
            stdTTL: ttlSeconds,
            checkperiod: ttlSeconds * 0.2
        });
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
     * Sets a key value pair a cached value from a key.
     * @param {key Type} key - The key
     * @param {element Type} value - The value to cache
     * @return {bool} true on success
     */
    set(key, value) {
        return (this.cache.set(key, value));
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
}
module.exports = Cache;