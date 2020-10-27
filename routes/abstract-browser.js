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
 * Logger
 * @type {winston.Logger}
 */
const logger = require('../config/logger');

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
 * Frontend provider for browser.
 *
 * @param req
 * @param res
 * @param next
 * @param pageUrlPrefix
 * @param ajaxUrlPrefix
 * @param pageTitle
 * @param pageDescription
 * @param fixedQueries
 */
function frontend(req, res, next, pageUrlPrefix, ajaxUrlPrefix, pageTitle, pageDescription, fixedQueries) {
    const pageNumberInt = sanitize.parsePositiveInteger(req.params ? req.params.pageNumber : undefined);

    const data = {};
    data.pageTitle = pageTitle;
    data.pageDescription = pageDescription;
    data.pageUrl = 'https://villagerdb.com' + pageUrlPrefix + pageNumberInt;
    data.pageUrlPrefix = pageUrlPrefix;
    data.ajaxUrlPrefix = ajaxUrlPrefix;
    data.allFilters = JSON.stringify(config.filters);
    data.appliedFilters = JSON.stringify(browser.getAppliedFilters(cleanQueries(req.query), fixedQueries));
    data.currentPage = sanitize.parsePositiveInteger(req.params ? req.params.pageNumber : undefined);;
    res.render('browser', data);
}
module.exports.frontend = frontend;

/**
 * AJAX provider for browser.
 * @param req
 * @param res
 * @param next
 * @param fixedQueries
 */
function ajax(req, res, next, fixedQueries) {
    const pageNumber = sanitize.parsePositiveInteger(req.params ? req.params.pageNumber : undefined);
    browser.browse(pageNumber, cleanQueries(req.query), fixedQueries)
        .then((result) => {
            res.send(result);
        })
        .catch((e) => {
            // Log and send
            logger.error('Browser error at url ' + req.originalUrl + ': ' + e.message +
                ': ' + e.stack);
            res.status(500).send({
                errorText: e.message
            });
        });
}
module.exports.ajax = ajax;