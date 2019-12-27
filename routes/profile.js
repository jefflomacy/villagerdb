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
    if (!req.session.passport) {
        res.redirect('/auth/login');
    } else {
        next();
    }
};

/**
 * Route for profile.
 */
router.get('/', authCheck, (req, res) => {
    console.log(req.session);
    res.send('Your Profile : ' + req.session['passport']);
})

module.exports = router;