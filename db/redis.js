const redis = require('redis');
const bluebird = require('bluebird');
const redisClient = bluebird.Promise.promisifyAll(redis.createClient());

module.exports = redisClient;