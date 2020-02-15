const redis = require('redis');
const bluebird = require('bluebird');
const redisClient = bluebird.Promise.promisifyAll(redis.createClient(process.env.REDIS_CONNECT_STRING));

module.exports = redisClient;