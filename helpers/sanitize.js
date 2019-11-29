/**
 *
 * @type {{}}
 */
const searchConfig = require('../config/search');

/**
 * Return the given input as a parsed integer if it is a positive integer. Otherwise, return 1.
 *
 * @param value
 * @returns {number}
 */
module.exports.parsePositiveInteger = (value) => {
    const parsedValue = parseInt(value);
    if (Number.isNaN(parsedValue) || parsedValue < 1) {
        return 1;
    }

    return parsedValue;
};

/**
 * Clean an individual input value.
 *
 * @param value
 * @returns {*|jQuery|string}
 */
module.exports.cleanQuery = (value) => {
    if (typeof value === 'string') {
        if (value.length > searchConfig.maxQueryLength) {
            let e = new Error('Invalid request.');
            e.status = 400;
            throw e;
        }

        return value.trim();
    }
}