const redis = require('redis');
const redisClient = redis.createClient(process.env.REDIS_SESSION_CONNECT_STRING);
module.exports = redisClient;