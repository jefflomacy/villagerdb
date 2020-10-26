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
    browser.frontend(req,
        res,
        next,
        '/villagers/page/',
        '/villagers/ajax/page/',
        'Villagers',
        'Browse our villager database to learn more about your favorite ' +
        'characters from all of the Animal Crossing games.',
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
    browser.ajax(req,
        res,
        next,
        FIXED_QUERY);
});

module.exports = router;