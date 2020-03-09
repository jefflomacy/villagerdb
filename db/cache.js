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
     * @returns {Promise<*>}
     */
    async set(key, value) {
        return this.redisClient.setAsync(this.keyPrefix + key, value);
    }
}

module.exports = new Cache(redis);