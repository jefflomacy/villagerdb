const path = require('path');
const fs = require('fs');

/**
 * URL Helper
 */
const urlHelper = require('../../helpers/url');

/**
 * Abstract redis store. Takes a redis connection, a set name, a key prefix and a directory containing JSON files.
 * These JSON files then get loaded into Redis.
 */
class RedisStore {
    /**
     * Create the store.
     *
     * @param redis redis client instance
     * @param setName contains all the keys we will create (without prefixes) (e.g. villagers)
     * @param entityType the type of the entity (villager, item, etc)
     * @param dataStorePath where the JSON files to be loaded exist (e.g. path.join('data', 'villagers'))
     */
    constructor(redis, setName, entityType, dataStorePath) {
        this.redisClient = redis;
        this.setName = setName;
        this.entityType = entityType;
        this.keyPrefix = entityType + '_';
        this.dataStorePath = dataStorePath;
    }

    /**
     * Get total entity count.
     *
     * @returns {Promise<*>}
     */
    async count() {
        return await this.redisClient.zcardAsync(this.setName);
    }

    /**
     * Get a range from 1 to n. Retrieves it from the zset "setName" which is sorted alphabetically. Lower scores are
     * sooner in the alphabet.
     *
     * @param min
     * @param max
     * @returns {Promise<Array>}
     */
    async getByRange(min, max) {
        let keys = await this.redisClient.zrangeAsync(this.setName, min, max);

        const result = [];
        for (let key of keys) {
            let data = await this.redisClient.getAsync(this.keyPrefix + key);
            if (data) {
                let parsed = JSON.parse(data);
                result.push(parsed);
            }
        }

        return result;
    }

    /**
     * Retrieve an entity by id.
     * @param id
     * @returns {Promise<*>}
     */
    async getById(id) {
        const raw = await this.redisClient.getAsync(this.keyPrefix + id);
        return JSON.parse(raw);
    }

    /**
     * Get multiple objects matching the given IDs.
     * @param ids
     * @returns {Promise<*>}
     */
    async getByIds(ids) {
        if (ids.length === 0) {
            return [];
        }

        const prefixedIds = [];
        for (let id of ids) {
            prefixedIds.push(this.keyPrefix + id);
        }

        const raws = await this.redisClient.mgetAsync(prefixedIds);
        const results = [];
        for (let raw of raws) {
            results.push(JSON.parse(raw));
        }

        return results;
    }

    /**
     * Return all IDs matching on the given glob.
     *
     * @param glob
     * @returns {Promise<*>}
     */
    async searchById(glob) {
        // Clean up the search string a bit.
        glob = glob.toLowerCase();
        glob = glob.replace(/\s+/g, '_'); // replace one or more spaces with a single _
        glob = glob.replace(/[^\w]/g, ''); // remove any non-alphanumeric characters.

        // Search
        const results = [];
        let cursor = 0;
        do {
            // Result consists of: the cursor at index 0, and the results at index 1.
            const result = await this.redisClient.zscanAsync(this.setName, cursor, 'MATCH', '*' + glob + '*',
                'COUNT', 100); // 100 is arbitrary.
            cursor = result[0];
            // Results are in pairs (key, zscore). We don't care about the zscore because we just used it for sorting,
            // so we skip every other entry.
            for (let i = 0; i < result[1].length; i += 2) {
                results.push(result[1][i]);
            }
        } while (cursor != 0);

        return results;
    }

    /**
     * Fill the redis database with entity information. All previous information in the database for this entity type
     * will be cleared when this routine is called.
     *
     * @returns {Promise<void>}
     */
    async populateRedis() {
        // Track all the keys we add.
        const keys = [];

        // Read each file in the directory.
        const files = fs.readdirSync(this.dataStorePath);

        // Clear the old setName.
        await this.redisClient.delAsync(this.setName);

        // Clear all old keys matching our prefix.
        let cursor = 0;
        do {
            const result = await this.redisClient.scanAsync(cursor, 'MATCH', this.keyPrefix + '*', 'COUNT', 100);
            cursor = result[0];
            if (cursor != 0 && result.length > 0 && result[1].length > 0) {
                await this.redisClient.delAsync(result[1]);
            }
        } while (cursor != 0);

        // Loop through each file and add it to the database with the proper key prefix.
        for (let file of files) {
            const data = fs.readFileSync(path.join(this.dataStorePath, file), 'utf8');
            let parsed = JSON.parse(data);
            parsed = this._addImageData(parsed);
            parsed = this._handleEntity(parsed); // custom logic for each specific implementation
            await this.updateEntity(parsed.id, parsed); // insert minified
            keys.push(parsed.id);
        }

        // Sort keys alphabetically and then insert them.
        keys.sort();
        for (let i = 0; i < keys.length; i++) {
            await this.redisClient.zaddAsync(this.setName, i + 1, keys[i]);
        }
    }

    /**
     * Set a key in redis to the specified object. This should NOT be used to ADD a NEW entity, because the ZSet in
     * Redis is NOT updated.
     *
     * @param id
     * @param entity
     * @returns {Promise<void>}
     */
    async updateEntity(id, entity) {
        await this.redisClient.setAsync(this.keyPrefix + id, JSON.stringify(entity)); // insert minified
    }

    /**
     * Implementations can override this method to modify the object going into Redis before it is saved. By default,
     * it just returns the entity it was given.
     *
     * @param entity
     * @returns {{}}
     * @private
     */
    _handleEntity(entity) {
        return entity;
    }

    /**
     * Add image data to the object.
     *
     * @param entity
     * @returns {{}}
     * @private
     */
    _addImageData(entity) {
        entity.image = urlHelper.getEntityImageData(this.entityType, entity.id);
        return entity;
    }
}

module.exports = RedisStore;