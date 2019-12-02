const path = require('path');
const RedisStore = require('./redis-store');
const redisConnection = require('../redis');

class Villagers extends RedisStore {
    constructor() {
        super(redisConnection, 'villagers', 'villager', path.join('data', 'villagers'));
    }
}

module.exports = new Villagers();