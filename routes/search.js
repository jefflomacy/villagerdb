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
 * Search entry point.
 *
 * @param req
 * @param res
 * @param next
 */
function search(req, res, next) {
    const searchQuery = sanitize.cleanQuery(req.query.q);
    const pageTitle = typeof searchQuery !== 'undefined' && searchQuery.length > 0?
        'Search results for \'' + searchQuery + '\'' : 'Browse catalog';
    const pageNumber = req.params ? req.params.pageNumber : undefined;
    const pageNumberInt = sanitize.parsePositiveInteger(pageNumber);

    const data = {};
    data.searchQuery = searchQuery;
    browse(res, next, pageNumberInt,
        '/search/page/', pageTitle, req.query, {}, data);
}

/**
 *
 * @type {Router}
 */
const router = express.Router();

router.get('/', function (req, res, next) {
    search(req, res, next);
});

router.get('/page/:pageNumber', function (req, res, next) {
    search(req, res, next);
});

module.exports = router;