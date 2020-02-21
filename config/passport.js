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
        callbackURL: 'http://localhost/auth/google/redirect' // TODO
    }, (accessToken, refreshToken, content, callback) => {
        const userInfo = content['_json'];
        const googleId = userInfo['sub'];
        const email = userInfo['email'];

        // Is it a new user, or an existing one?
        users.findUserByGoogleId(googleId)
            .then((existingUser) => {
                if(existingUser) {
                    callback(null, existingUser);
                } else {
                    // Create a new user.
                    users.saveUser(googleId, email)
                        .then((newUser) => {
                            callback(null, newUser)
                        });
                }
            });
    })
);

/**
 * Serialize user function - we turn the user into their Mongo database ID.
 */
passport.serializeUser(function(user, callback) {
    callback(null, user._id);
});

/**
 * Deserialize user function - grabs the user from the database in Mongo.
 *
 * TODO: Long term, this may be a pain point for efficiency. We will need to keep an eye on if we need a caching layer
 * in Redis here.
 */
passport.deserializeUser(function(id, callback) {
    // TODO: This will happen on every page load for a logged-in user. Potentially very painful in the long run.
    users.findUserById(id)
        .then((user) => {
            if (user) {
                const userData = {};
                userData.id = user._id;
                userData.username = user.username;
                callback(null, userData);
            } else {
                callback(null, null);
            }
        });
});

module.exports = passport;