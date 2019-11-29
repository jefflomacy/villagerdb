/**
 *
 * @type {createApplication}
 */
const express = require('express');

/**
 *
 * @type {browse}
 */
const browse = require('./abstract-browser');

/**
 * Sanitizer.
 */
const sanitize = require('../helpers/sanitize');

/**
 *
 * @type {Router}
 */
const router = express.Router();

/* GET villagers listing. */
router.get('/', function (req, res, next) {
    res.redirect('/villagers/page/1', 302);
});

/* GET villagers page number */
router.get('/page/:pageNumber', function (req, res, next) {
    const data = {};
    browse(res, next, sanitize.parsePositiveInteger(req.params.pageNumber),
        '/villagers/page/',
        'All villagers',
        req.query,
        {type: ['villager']},
        data);
});

module.exports = router;