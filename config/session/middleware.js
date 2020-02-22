const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('./store');

const configuredSession = session({
    secret: process.env.COOKIE_KEY,
    resave: false, // connect-redis implements touch, so this is not needed.
    saveUninitialized: false, // we only care about sessions that actually log in, so lets save disk space
    store: new RedisStore({client: redisClient}),
    cookie: {
        secure: process.env.NODE_ENV === 'production', // only enforce secure cookie in production mode
        maxAge: parseInt(process.env.SESSION_LENGTH)
    }
});

module.exports = configuredSession;