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
    data.pageTitle = pageTitle;
    data.pageUrlPrefix = urlPrefix;

    browser(pageNumber, cleanQueries(userQueries), fixedQueries)
        .then((result) => {
            if (userQueries.isAjax === 'true') {
                res.send(result);
            } else {
                data.initialState = JSON.stringify(result); // TODO: Need to stop doing this someday.
                data.allFilters = JSON.stringify(config.filters);
                data.result = result;
                res.render('browser', data);
            }
        })
        .catch(next);;
}
module.exports = browse;