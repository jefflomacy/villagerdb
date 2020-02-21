const moment = require('moment');
const { check, validationResult, body } = require('express-validator');
const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const users = require('../db/entity/users');

/**
 * Terminates the session and deletes the user from the database.
 *
 * @param req
 * @param res
 * @param next
 * @param redirectUrl
 */
const cancelRegistration = (req, res, next, redirectUrl) => {
    users.deleteUser(req.user.id)
        .then(() => {
            req.session.destroy();
            res.redirect(redirectUrl);
        })
        .catch(next);
};

/**
 * COPPA Compliance error catcher.
 */
router.get('/coppa-decline', (req, res, next) => {
    res.render('coppa-decline', {
        pageTitle: 'COPPA Compliance Notice'
    });
});

/**
 * Perform Google authentication with passport
 */
router.get('/google', passport.authenticate('google', {
    scope: ['email']
}));

/**
 * Logs out by destroying user's session and redirecting to home.
 */
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/**
 * Google Redirect Callback Route
 */
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.redirect('/auth/register')
});

/**
 * Set display name and prompt 13+ agreement after logging in with Google for the first time.
 */
router.get('/register', (req, res, next) => {
    if (!res.locals.userState.isLoggedIn) {
        res.redirect('/auth/login')
    } else {
        users.findUserById(req.user.id)
            .then((user) => {
                if (user && user.username) { // found and registered
                    res.redirect('/');
                } else { // either not found, or not registered.
                    const data = {};
                    data.pageTitle = 'Create an Account';

                    // Build out months and days
                    data.months = [];
                    for (let i = 1; i <= 12; i++) {
                        data.months.push({
                            id: i,
                            selected: typeof req.session.registrationForm !== 'undefined' &&
                                req.session.registrationForm.birthMonth == i
                        });
                    }
                    data.days = [];
                    for (let i = 1; i <= 31; i++) {
                        data.days.push({
                            id: i,
                            selected: typeof req.session.registrationForm !== 'undefined' &&
                                req.session.registrationForm.birthDay == i
                        });
                    }

                    data.errors = req.session.errors;
                    Object.assign(data, req.session.registrationForm);
                    delete req.session.errors;
                    delete req.session.registrationForm;
                    res.render('register', data);
                }
            })
            .catch(next);
    }
});

/**
 * Route to verify registration form
 */
router.post('/register',
    [
        body(
            'username',
            'Usernames must be between 3 and 25 characters long.'
        )
            .isLength( { min: 3, max:25 }),
        body('username',
            'Usernames can only have letters and numbers.'
        )
            .isAlphanumeric(),
        body(
            'tos-check',
            'To sign up you must agree to our Privacy Policy and Terms of Service')
            .exists(),
        body(
            'username',
            'That username is already taken. Please choose a different one.'
        )
            .custom((value) => {
                return users.usernameAlreadyExists(value)
                    .then((userExists) => {
                        if (userExists) {
                            return Promise.reject();
                        }
                    });
            }),
        body(
            'birth-month',
            'Please enter a valid birth month.'
        )
            .isNumeric(),
        body(
            'birth-day',
            'Please enter a valid birth day.'
        )
            .isNumeric(),
        body(
            'birth-year',
            'Please enter a valid birth year.'
        )
            .matches('[1-2][0-9][0-9][0-9]')
    ],
    (req, res, next) => {
    const username = req.body.username;
    const errors = validationResult(req);

    // If there were validation errors, stop.
    if (!errors.isEmpty()) {
        // Send it all back to the form.
        req.session.errors = errors.array();
        req.session.registrationForm = {
            username: req.body.username,
            birthMonth: req.body['birth-month'],
            birthDay: req.body['birth-day'],
            birthYear: req.body['birth-year']
        };
        res.redirect('/auth/register');
    } else {
        // Do 13-years-or-older check. If this fails, terminate registration.
        const diff = moment()
            .diff(moment([req.body['birth-year'], req.body['birth-month'] - 1, req.body['birth-day']]), 'years');
        if (diff < 13) {
            // Terminate session and redirect to coppa rejection page.
            cancelRegistration(req, res, next, '/auth/coppa-decline');
        } else {
            // Otherwise, we can set them as registered!
            users.setRegistered(username, req.user.id)
                .then(() => {
                    res.redirect('/');
                })
                .catch(next);
        }
    }
});

/**
 * Route to cancel registration. Deletes user from database and logs them out.
 */
router.post('/register-cancel', (req, res, next) => {
    cancelRegistration(req, res, next, '/');
});

module.exports = router;