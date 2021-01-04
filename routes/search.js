/**
 *
 * @type {createApplication}
 */
const express = require('express');

/**
 *
 * @type {browse}
 */
const browser = require('./abstract-browser');

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
function frontend(req, res, next) {
    const searchQuery = sanitize.cleanQuery(req.query.q);

    browser.frontend(req,
        res,
        next,
        '/search/page/',
        '/search/ajax/page/',
        typeof searchQuery !== 'undefined' && searchQuery.length > 0?
            'Search results for \'' + searchQuery + '\'' : 'Browse catalog',
        undefined,
        {});
}

/**
 *
 * @type {Router}
 */
const router = express.Router();

router.get('/', (req, res, next) => {
    frontend(req, res, next);
});

router.get('/page/:pageNumber', (req, res, next) => {
    frontend(req, res, next);
});

router.get('/ajax/page/:pageNumber', (req, res, next) => {
    browser.ajax(req,
        res,
        next,
        {});
});

module.exports = router;