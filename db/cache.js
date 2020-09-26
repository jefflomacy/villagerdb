const redis = require('./redis');

/**
 * Basic key-value store cache.
 */
class Cache {
    /**
     * Create the cache.
     *
     * @param redis redis client instance.
     */
    constructor(redisClient) {
        this.redisClient = redisClient;
        this.keyPrefix = 'cache:';
    }

    /**
     * Get cached value by key.
     *
     * @param id
     * @returns {Promise<*>}
     */
    async get(key) {
        return this.redisClient.getAsync(this.keyPrefix + key);
    }

    /**
     * Set a key in the cache.
     *
     * @param key
     * @param value
     * @param ttl (optional) how long the key should live before expiring (seconds)
     */
    async set(key, value, ttl) {
        await this.redisClient.setAsync(this.keyPrefix + key, value);
        if (typeof ttl === 'number') {
            await this.redisClient.expireAsync(this.keyPrefix + key, ttl);
        }
    }

    /**
     * Delete a cache entry.
     * @param key
     * @returns {Promise<void>}
     */
    async delete(key) {
        await this.redisClient.delAsync(this.keyPrefix + key);
    }
}

module.exports = new Cache(redis);