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
    res.redirect('/search/page/1', 302);
});

/* GET villagers page number */
router.get('/page/:pageNumber', function (req, res, next) {
    const searchQuery = sanitize.cleanQuery(req.query.q);
    const pageTitle = typeof searchQuery !== 'undefined' && searchQuery.length > 0?
        'Search reuslts for \'' + searchQuery + '\'' : 'Browse catalog';
    const data = {};
    data.searchQuery = searchQuery;
    browse(res, next, sanitize.parsePositiveInteger(req.params.pageNumber),
        '/search/page/', pageTitle, req.query, {}, data);
});

module.exports = router;