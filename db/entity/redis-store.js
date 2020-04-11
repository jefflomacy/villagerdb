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
     *
     * @param ids
     * @returns {Promise<{}>}
     */
    async getByIds(ids) {
        if (ids.length === 0) {
            return {};
        }

        // Uniqueify the list.
        ids = ids.filter((v, i, s) => {
            return s.indexOf(v) === i;
        });

        const prefixedIds = [];
        for (let id of ids) {
            prefixedIds.push(this.keyPrefix + id);
        }

        const raws = await this.redisClient.mgetAsync(prefixedIds);
        const results = {};
        let counter = 0;
        for (let raw of raws) {
            if (raw) {
                results[ids[counter]] = JSON.parse(raw);
            }
            counter++;
        }

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

        // Loop through each file and add it to the database with the proper key prefix.
        for (let file of files) {
            const filePath = path.join(this.dataStorePath, file);
            console.log('Processing ' + filePath);
            const data = fs.readFileSync(filePath, 'utf8');
            let parsed = JSON.parse(data);
            parsed = this._addImageData(parsed);
            parsed = this._handleEntity(parsed); // custom logic for each specific implementation
            await this.updateEntity(parsed.id, parsed); // insert minified
            keys.push(parsed.id);
        }

        // Sort keys alphabetically and then insert them after deleting old set.
        keys.sort();
        await this.redisClient.delAsync(this.setName);
        for (let i = 0; i < keys.length; i++) {
            await this.redisClient.zaddAsync(this.setName, i + 1, keys[i]);
        }

        // Post-population actions.
        await this._afterPopulation();
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

    /**
     * Override this method to perform actions after the database finishes populating.
     *
     * @private
     */
    async _afterPopulation() {

    }

    /**
     * Returns a parsed item for the given ID, if it exists.
     * @param entityType
     * @param id
     * @returns {any}
     * @private
     */
    _loadData(entityType, id) {
        if (fs.existsSync(path.join('data', entityType + 's', id + '.json'))) {
            return JSON.parse(fs.readFileSync(path.join('data', entityType + 's', id + '.json'),
                'utf8'));
        }
    }
}

module.exports = RedisStore;