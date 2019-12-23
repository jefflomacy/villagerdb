const express = require('express');
const router = express.Router();

/**
 *
 * Check if user is logged in.
 *
 * @param req
 * @param res
 * @param next
 */
const authCheck = (req, res, next) => {
    if (!req.user) {
        res.redirect('/auth/login');
    } else {
        next();
    }
};

/**
 * Route for profile.
 */
router.get('/', authCheck, (req, res) => {
    res.send('Your Profile : ' + req.user['email']);
})

module.exports = router;