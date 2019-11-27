/**
 *
 * @type {createApplication}
 */
const express = require('express');

/**
 *
 * @type {browse}
 */
const browser = require('../helpers/browser.js');

/**
 *
 */
const sanitize = require('../helpers/sanitize.js');

/**
 *
 * @type {{}}
 */
const config = require('../config/search.js');

/**
 *
 * @type {{}}
 */
const allFilters = config.filters;

/**
 * Call the browser.
 *
 * @param req
 * @param res
 * @param next
 * @param pageNumber
 */
function browse(req, res, next, pageNumber) {
    const data = {};
    const searchQuery = typeof req.query.q === 'string' && req.query.q.trim().length > 0 ? req.query.q : undefined;
    data.pageTitle = typeof searchQuery !== 'undefined' ?
        'Search reuslts for \'' + searchQuery + '\'' : 'Browse catalog';
    data.pageUrlPrefix = '/search/page/';
    data.searchQuery = searchQuery;

    browser(res.app.locals.es, pageNumber, req.query)
        .then((result) => {
            handleResult(req, res, next, data, result);
        })
        .catch(next);;
}

/**
 * Handle result of browser call.
 *
 * @param req
 * @param res
 * @param next
 * @param data
 * @param result
 */
function handleResult(req, res, next, data, result) {
    if (req.query.isAjax === 'true') {
        res.send(result);
    } else {
        res.app.locals.db.birthdays.getBirthdays()
            .then((birthdays) => {
                data.birthdays = birthdays;
                data.shouldDisplayBirthdays = birthdays.length > 0;
                data.initialState = JSON.stringify(result);
                data.allFilters = JSON.stringify(allFilters);
                data.result = result;
                res.render('browser', data);
            })
            .catch(next);
    }
}

const router = express.Router();
/* GET villagers listing. */
router.get('/', function (req, res, next) {
    browse(req, res, next, 1);
});

/* GET villagers page number */
router.get('/page/:pageNumber', function (req, res, next) {
    browse(req, res, next, sanitize.parsePositiveInteger(req.params.pageNumber));
});

module.exports = router;