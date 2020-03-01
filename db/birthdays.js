const redisConnection = require('../db/redis');
const villagers = require('../db/entity/villagers');

/**
 * Redis key for birthday storage.
 *
 * @type {string}
 */
const KEY_NAME = 'birthdays';

/**
 * Birthdays calculator.
 */
class Birthdays {
    /**
     * Create the repository with an existing villager collection.
     *
     * @param redisClient
     * @param collection
     */
    constructor(redisClient, collection) {
        this.redisClient = redisClient;
        this.collection = collection;
    }

    /**
     * Stores villager id and birthday in a pair in redis
     *
     * @returns {Promise<[]>}
     */
    async computeBirthdays() {
        // Pull all villagers from Redis.
        const count = await this.collection.count();
        const villagers = await this.collection.getByRange(0, count); // get them all using zrange.

        // Logic to parse data and store today's birthdays.
        const results = [];
        for (let villager of villagers) {
            let birthday = villager.birthday;

            if (typeof birthday === 'string' && this.compareBirthdays(birthday)) {
                const serializedBirthday = {};
                serializedBirthday.id = villager.id;
                serializedBirthday.name = villager.name;
                results.push(serializedBirthday);
            }
        }

        await this.redisClient.setAsync(KEY_NAME, JSON.stringify(results));
        return results;
    }

    /**
     * Computes if a given birthday is equal to today's date.
     *
     * @param birthday the birthday of a given villager
     * @returns {boolean}
     */
    compareBirthdays(birthday) {
        // Turn the birthday into two ints.
        const split = birthday.split('-');
        const birthMonth = parseInt(split[0]);
        const birthDay = parseInt(split[1]);

        // Get today's date in stored format.
        let today = new Date();
        let mm = today.getMonth() + 1;
        let dd = today.getDate();

        return birthMonth === mm && birthDay === dd;
    }

    /**
     * Fetches today's birthdays. Computation is done lazily. If not found in Redis, we will compute them and
     * then return them. Always returns an array, even if there are no birthdays.
     *
     * @returns {Promise<[]>}
     */
    async getBirthdays() {
        let rawData = await this.redisClient.getAsync(KEY_NAME);
        if (rawData) {
            return JSON.parse(rawData);
        }

        // Hmm, looks like we need to compute it!
        return await this.computeBirthdays();
    }

    /**
     * Clear the key containing birthdays in Redis so they can be recomputed.
     * @returns {Promise<void>}
     */
    async clearBirthdays() {
        await this.redisClient.delAsync(KEY_NAME);
    }
}

module.exports = new Birthdays(redisConnection, villagers);