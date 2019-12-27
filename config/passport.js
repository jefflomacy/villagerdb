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
                    existingUser.isNewUser = false;
                    cb(null, existingUser);
                } else {
                    users.saveUser(googleId, email)
                        .then((newUser) => {
                            console.log('New user created.');
                            newUser.isNewUser = true;
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
    let userData = {};
    userData.id = user._id;
    userData.googleId = user.googleId;
    userData.isNewUser = user.isNewUser;
    cb(null, userData);
});

/**
 * Deserialize user function
 */
passport.deserializeUser(function(id, cb) {
    users.findUserById(id)
        .then((user) => {
            console.log(user);
            cb(null, user);
        });
});

module.exports.middleware = passport;