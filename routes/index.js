const express = require('express');
const router = express.Router();

const birthdays = require('../db/birthdays');

/* GET home page. */
router.get('/', function(req, res, next) {
    // Birthday info
    birthdays.getBirthdays()
        .then((birthdays) => {
            res.render('index', {
                pageDescription: 'The largest Animal Crossing item, villager database and wishlist maker on the internet.',
                birthdays: birthdays,
                shouldDisplayBirthdays: birthdays.length > 0
            });
        })
        .catch(next);
});

/* GET login page. */
router.get('/login', function(req, res, next) {
    res.render('login', {
        pageTitle: 'Log In'
    });
});

/* GET terms of service page. */
router.get('/terms-of-service', function(req, res, next) {
    res.render('terms-of-service', {
        pageTitle: 'Terms of Service'
    });
});

/* GET privacy policy page. */
router.get('/privacy-policy', function(req, res, next) {
    res.render('privacy-policy', {
        pageTitle: 'Privacy Policy'
    });
});

module.exports = router;
