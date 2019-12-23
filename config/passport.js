const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const users = require('../db/entity/users');

/**
 * Setup Google strategy for passport.js and callback function
 */
passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, content, cb) => {
        const userInfo = content['_json'];
        const googleId = userInfo['sub'];
        const email = userInfo['email'];

        users.findUserByGoogleId(googleId)
            .then((existingUser) => {
                if(existingUser) {
                    console.log('User already exists.');
                    cb(null, existingUser);
                } else {
                    users.saveUser(googleId, email)
                        .then((newUser) => {
                            console.log('New user created.');
                            cb(null, newUser)
                        });
                }
            });

    })
);

/**
 * Serialize user function
 */
passport.serializeUser(function(user, cb) {
    cb(null, user['_id']);
});

/**
 * Deserialize user function
 */
passport.deserializeUser(function(id, cb) {
    users.findUserById(id)
        .then((user) => {
            cb(null, user);
        });
});

module.exports.middleware = passport;