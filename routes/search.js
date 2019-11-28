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
 * Clean an individual input value.
 *
 * @param value
 * @returns {*|jQuery|string}
 */
function cleanQuery(value) {
    if (typeof value === 'string') {
        if (value.length > config.maxQueryLength) {
            let e = new Error('Invalid request.');
            e.status = 400;
            throw e;
        }

        return value.trim();
    }
}

/**
 * Clean up input from frontend by making sure it matches a known filter and does not exceed the max string length.
 *
 * @param userQueries
 * @return {{}}
 */
function cleanQueries(userQueries) {
    const cleanedUserQueries = {};
    for (let key in userQueries) {
        if (typeof config.filters[key] !== 'undefined') {
            // Split normal queries on comma, but not textual search queries.
            if (config.filters[key].isTextSearch) {
                const cleaned = cleanQuery(userQueries[key]);
                if (typeof cleaned === 'string' && cleaned.length > 0) {
                    cleanedUserQueries[key] = [cleaned];
                }
            } else {
                const values = userQueries[key].split(',');
                const setValues = [];
                for (let value of values) {
                    const cleaned = cleanQuery(value);
                    if (typeof cleaned === 'string' && cleaned.length > 0) {
                        setValues.push(cleaned);
                    }
                }
                if (setValues.length > 0) {
                    // Set them.
                    cleanedUserQueries[key] = setValues;
                }
            }
        }
    }

    return cleanedUserQueries;
}

/**
 * Call the browser.
 *
 * @param res
 * @param next
 * @param pageNumber
 * @param urlPrefix
 * @param pageTitle
 * @param userQueries - these get sanitized from the frontend.
 * @param fixedQueries
 * @param data
 */
function browse(res, next, pageNumber, urlPrefix, pageTitle, userQueries, fixedQueries, data) {
    data.pageTitle = pageTitle + ' - page ' + pageNumber;
    data.pageUrlPrefix = urlPrefix;

    browser(pageNumber, cleanQueries(userQueries), fixedQueries)
        .then((result) => {
            if (userQueries.isAjax === 'true') {
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
    const searchQuery = cleanQuery(req.query.q);
    const pageTitle = typeof searchQuery !== 'undefined' && searchQuery.length > 0?
        'Search reuslts for \'' + searchQuery + '\'' : 'Browse catalog';
    const data = {};
    data.searchQuery = searchQuery;
    browse(res, next, sanitize.parsePositiveInteger(req.params.pageNumber),
        '/search/page/', pageTitle, req.query, {}, data);
});

module.exports = router;