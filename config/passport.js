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
        callbackURL: process.env.GOOGLE_REDIRECT_URL
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
                        })
                        .catch((err) => {
                            callback(err);
                        });
                }
            })
            .catch((err) => {
                callback(err);
            });
    })
);

/**
 * Serialize user function - we turn the user into their Mongo database ID.
 */
passport.serializeUser(function(user, callback) {
    if (user && typeof user._id !== 'undefined') {
        callback(null, user._id);
    } else {
        callback(null, null);
    }
});

/**
 * Deserialize user function - grabs the user from the database in Mongo.
 */
passport.deserializeUser(function(id, callback) {
    // Make sure the serialized user is a string and not something strange
    if (typeof id !== 'string') { callback(null, null); }

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
        })
        .catch((err) => {
            callback(err);
        });
});

module.exports = passport;