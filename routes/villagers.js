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
 * Fixed query for the engine.
 * @type {{type: [string]}}
 */
const FIXED_QUERY = {
    type: ['villager']
};

/**
 * Invokes the browser.
 * @param req
 * @param res
 * @param next
 */
function frontend(req, res, next) {
    const data = {};
    const pageNumber = req.params ? req.params.pageNumber : undefined;
    const pageNumberInt = sanitize.parsePositiveInteger(pageNumber);

    // Social media information
    data.pageUrl = 'https://villagerdb.com/villagers' +
        (typeof pageNumber !== 'undefined' ? '/page/' + pageNumberInt : '');
    data.pageDescription = 'Browse our villager database to learn more about your favorite ' +
        'characters from all of the Animal Crossing games.';
    data.shareUrl = encodeURIComponent(data.pageUrl);

    browser.frontend(res, next, pageNumberInt,
        '/villagers/page/',
        '/villagers/ajax/page/',
        'Villagers',
        req.query,
        FIXED_QUERY,
        data);
}

function ajax(req, res, next) {
    const pageNumber = req.params ? req.params.pageNumber : undefined;
    const pageNumberInt = sanitize.parsePositiveInteger(pageNumber);
    browser.ajax(res,
        next,
        pageNumberInt,
        req.query,
        FIXED_QUERY);
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
    ajax(req, res, next);
});

module.exports = router;