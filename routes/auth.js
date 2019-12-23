const express = require('express');
const router = express.Router();
const passport = require('passport');

/**
 * Login page
 */
router.get('/login', (req, res) => {
    res.render('login');
});

/**
 * Logout with passport.js
 */
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

/**
 * Google Auth with passport.js
 */
router.get('/google', passport.authenticate('google', {
    scope: ['email']
}));

/**
 * Google Redirect Callback Route
 */
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.redirect('/')
});

module.exports = router;