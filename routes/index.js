const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    const data = {
        pageTitle: 'Home'
    };

    res.render('index', {
        pageTitle: 'Home'
    });
});

module.exports = router;
