const express = require('express');
const router = express.Router();

/* GET login page. */
router.get('/login', function(req, res, next) {
    res.render('login', {
        pageTitle: 'Log In'
    });
});

module.exports = router;