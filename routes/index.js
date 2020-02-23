const express = require('express');
const router = express.Router();

const birthdays = require('../db/birthdays');

/* GET home page. */
router.get('/', function(req, res, next) {
    // Birthday info
    birthdays.getBirthdays()
        .then((birthdays) => {
            res.render('index', {
                pageTitle: 'Home',
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

module.exports = router;
