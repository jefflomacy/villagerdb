const path = require('path');
const fs = require('fs');

/**
 * Abstract cache store. Given a name and a Redis connection it will manage itself.
 */
class AbstractCache {
    /**
     * Create the cache.
     *
     * @param redis redis client instance
     * @param cacheName prefix of keys in this cache store.
     */
    constructor(redis, cacheName) {
        this.redisClient = redis;
        this.keyPrefix = cacheName + ':';
    }

    /**
     * Get cache entry by key.
     *
     * @param key
     * @returns {Promise<*>}
     */
    async get(key) {
        return this.redisClient.getAsync(this.keyPrefix + key);
    }

    /**
     * Set cache entry value for key.
     *
     * @param key
     * @param value
     * @returns {Promise<void>}
     */
    async set(key, value) {
        return this.redisClient.setAsync(this.keyPrefix + key, value);
    }

    /**
     * Delete the given cache entry.
     *
     * @param key
     * @returns {Promise<*>}
     */
    async del(key) {
        return this.redisClient.delAsync(this.keyPrefix + key);
    }

    /**
     * Delete all entries in this cache.
     * @returns {Promise<void>}
     */
    async flush() {
        // Scan for all keys matching and issue a delete.
        let cursor = 0;
        do {
            // Result consists of: the cursor at index 0, and the results at index 1.
            const result = await this.redisClient.scanAsync(cursor, 'MATCH', this.keyPrefix + '*',
                'COUNT', 100); // 100 is arbitrary.
            cursor = result[0];
            for (let i = 0; i < result[1].length; i++) {
                await this.redisClient.delAsync(result[1][i]);
            }
        } while (cursor != 0);
    }
}

module.exports = AbstractCache;