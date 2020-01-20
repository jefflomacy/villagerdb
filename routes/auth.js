const express = require('express');
const router = express.Router();
const passport = require('passport');
const users = require('../db/entity/users');
const { check, validationResult, body } = require('express-validator');

/**
 * Login page
 */
router.get('/login', (req, res) => {
    if (res.locals.userState.isLoggedIn) {
        users.isRegistered(res.locals.userState.googleId)
            .then((isRegistered) => {
                if (isRegistered) {
                    res.redirect('/');
                } else {
                    res.redirect('/auth/register');
                }
            });
    } else {
        res.render('login');
    }
});

/**
 * Logout with passport.js
 */
router.get('/logout', (req, res) => {
    req.session.destroy();
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
    res.redirect('/auth/register')
});

/**
 * Set display name and prompt 13+ agreement after logging in with Google for the first time.
 */
router.get('/register', (req, res) => {
    if (!res.locals.userState.isLoggedIn) {
        res.redirect('/auth/login')
    } else {
        users.isRegistered(res.locals.userState.googleId)
            .then((isRegistered) => {
                res.locals.userState.isRegistered = isRegistered;
                if (res.locals.userState.isLoggedIn && isRegistered) {
                    res.redirect('/');
                } else {
                    res.render('register');
                }
            });
    }
});

/**
 * Route to verify registration form
 */
router.post('/register-post', [
        check("username", "Username must be at least 3 characters long.").isLength( { min: 3 } ),
        check("username", "Username must be alphanumeric.").isAlphanumeric(),
        check("coppaCheck", "Age checkbox must be checked.").exists(),
        body("username")
            .custom((value) => {
                return users.usernameAlreadyExists(value)
                    .then((userExists) => {
                        if (userExists) {
                            return Promise.reject('Username already in use.');
                        }
                    });
            })
    ],
    (req, res) => {
    const username = req.body.username;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.render('register', errors);
    } else {
        users.setRegistered(username, res.locals.userState.googleId)
            .then(() => {
                console.log('User', username, 'registered.')
                res.redirect('/');
            })
    }

});

/**
 * Route to cancel registration. Deletes user from database and logs them out.
 */
router.post('/register-cancel', (req, res) => {
    console.log('User cancelling registration. Deleting user in db and destroying session.');
    users.deleteUser(res.locals.userState.googleId)
        .then(() => {
            console.log('User deleted from database.');
            req.session.destroy();
            res.redirect('/');
        })
        .catch((err) => {
            console.log('An unexpected error has occurred while attempting to delete user from database.');
            console.error(err);
        });
});

module.exports = router;