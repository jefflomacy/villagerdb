const redis = require('redis');
const redisClient = redis.createClient(process.env.REDIS_SESSION_CONNECT_STRING);

// Select the proper database.
redisClient.select(1, (error) => {
    if (error) {
        throw new Error('Could not select database 1 for session store: ' + error);
    }
});

module.exports = redisClient;