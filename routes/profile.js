const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');

/**
 *
 * Check if user is logged in.
 *
 * @param req
 * @param res
 * @param next
 */
const authCheck = (req, res, next) => {
    if (res.locals.userState.isLoggedIn) {
        next();
    } else {
        res.redirect('/auth/login');
    }
};

async function loadProfile(googleId) {
    const result = {};
    const user = await users.findUserByGoogleId(googleId);
    result.userName = user.displayName;

    return result;
}

/**
 * Route for profile.
 */
router.get('/:userName', authCheck, (req, res, next) => {
    loadProfile(res.locals.userState.googleId)
        .then((data) => {
            res.render('profile', data);
        }).catch(next);
});

module.exports = router;