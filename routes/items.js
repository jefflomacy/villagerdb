/**
 *
 * @type {createApplication}
 */
const express = require('express');

/**
 * Formatter.
 */
const format = require('../helpers/format');

/**
 *
 * @type {browse}
 */
const browse = require('./abstract-browser');

/**
 * Sanitizer.
 */
const sanitize = require('../helpers/sanitize');

/**
 * Map of URL slug to fixed query parameter to ElasticSearch.
 * @type {{}}
 */
const categories = {
    accessories: {category: ['Accessories']},
    bottoms: {category: ['Bottoms']},
    dresses: {category: ['Dresses']},
    hats: {category: ['Hats']},
    shoes: {category: ['Shoes']},
    socks: {category: ['Socks']},
    tops: {category: ['Tops']},
    umbrellas: {category: ['Umbrellas']},
    wetsuits: {category: ['Wetsuits']}
};

/**
 *
 * @type {Router}
 */
const router = express.Router();

// Build the URLs based on the slugs above.
for (let slug in categories) {
    router.get('/' + slug, (req, res, next) => {
        res.redirect('/' + slug + '/page/1', 302);
    });

    router.get('/' + slug + '/page/:pageNumber', (req, res, next) => {
        const data = {};
        browse(res, next, sanitize.parsePositiveInteger(req.params.pageNumber),
            '/items/' + slug + '/page/',
            'All ' + format.capFirstLetter(slug),
            req.query,
            categories[slug],
            data);
    });
}

module.exports = router;