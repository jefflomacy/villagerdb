const redis = require('redis');
const redisClient = redis.createClient();

// Select the proper database.
redisClient.select(1, (error) => {
    if (error) {
        throw new Error('Could not select database 1 for session store: ' + error);
    }
});

module.exports = redisClient;