const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

/**
 * Setup Google strategy for passport.js and callback function
 */
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, profile, cb) => {
        console.log(profile);
        return cb(null, profile);
    })
);

/**
 * Serialize user function
 */
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

/**
 * Deserialize user function
 */
passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});