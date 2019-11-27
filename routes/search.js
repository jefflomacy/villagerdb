/**
 *
 * @type {createApplication}
 */
const express = require('express');

/**
 *
 * @type {browse}
 */
const browser = require('../helpers/browser');

/**
 * Sanitizer.
 */
const sanitize = require('../helpers/sanitize');

/**
 * App config.
 * @type {{}}
 */
const config = require('../config/search');

/**
 * App state calculator.
 */
const appState = require('../helpers/app-state');

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

    browser(pageNumber, req.query)
        .then((result) => {
            if (req.query.isAjax === 'true') {
                res.send(result);
            } else {
                appState.getAppState(res)
                    .then((state) => {
                        Object.assign(data, state);
                        data.initialState = JSON.stringify(result); // TODO: Need to stop doing this someday.
                        data.allFilters = JSON.stringify(config.filters);
                        data.result = result;
                        res.render('browser', data);
                    })
                    .catch(next);
            }
        })
        .catch(next);;
}

const router = express.Router();

/* GET villagers listing. */
router.get('/', function (req, res, next) {
    res.redirect('/search/page/1', 302);
});

/* GET villagers page number */
router.get('/page/:pageNumber', function (req, res, next) {
    browse(req, res, next, sanitize.parsePositiveInteger(req.params.pageNumber));
});

module.exports = router;