const path = require('path');
const RedisStore = require('./redis-store');
const redisConnection = require('../redis');

class Items extends RedisStore {
    constructor() {
        super(redisConnection, 'items', 'item', path.join('data', 'items'));
    }
}

module.exports = new Items();