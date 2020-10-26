/**
 * App config.
 * @type {{}}
 */
const config = require('../config/search');

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
                const cleaned = sanitize.cleanQuery(userQueries[key]);
                if (typeof cleaned === 'string' && cleaned.length > 0) {
                    cleanedUserQueries[key] = [cleaned];
                }
            } else {
                const values = userQueries[key].split(',');
                const setValues = [];
                for (let value of values) {
                    const cleaned = sanitize.cleanQuery(value);
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
 * Determines if a query is a pure text-only query from the search box on the site.
 * This is only true if: 'q' is the only user query, and there are no fixed queries.
 *
 * @param userQueries
 * @param fixedQueries
 * @returns {boolean}
 */
function isTextOnlyQuery(userQueries, fixedQueries) {
    // Safety null checks.
    if (!userQueries) {
        return false;
    }

    const userKeys = Object.keys(userQueries);
    return userKeys.length === 1 && userKeys.includes('q')
        && !fixedQueries;
}

/**
 * AJAX provider for browser
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
function ajax(res, next, pageNumber, userQueries, fixedQueries) {
    browser.browse(pageNumber, cleanQueries(userQueries), fixedQueries)
        .then((result) => {
            res.send(result);
        })
        .catch(next);;
}
module.exports.ajax = ajax;

function frontend(res, next, pageNumber, pageUrlPrefix, ajaxUrlPrefix, pageTitle, userQueries, fixedQueries, data) {
    data.pageTitle = pageTitle;
    data.pageUrlPrefix = pageUrlPrefix;
    data.ajaxUrlPrefix = ajaxUrlPrefix;
    data.allFilters = JSON.stringify(config.filters);
    data.appliedFilters = JSON.stringify(browser.getAppliedFilters(cleanQueries(userQueries), fixedQueries));
    data.currentPage = pageNumber;
    res.render('browser', data);
}

module.exports.frontend = frontend;