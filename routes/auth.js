const express = require('express');
const router = express.Router();
const passport = require('passport');

/**
 * Login page
 */
router.get('/login', (req, res, next) => {
    res.render('login');
});

/**
 * Logout with passport.js
 */
router.get('/logout', (req, res, next) => {
    // Passport.js implementation
    res.send('logging out');
});

/**
 * Google Auth with passport.js
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile']
}));

/**
 * Google Redirect Callback Route
 */
router.get('/google/redirect', passport.authenticate('google'), (req, res, next) => {
    res.send('Redirecting...');
})

module.exports = router;