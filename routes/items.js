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
    accessories: {filter: {category: ['Accessories']}},
    art: {filter: {category: ['Art']}},
    balloons: {filter: {category: ['Balloons']}},
    bottoms: {filter: {category: ['Bottoms']}},
    bugs: {filter: {category: ['Bugs']}},
    'bushes-trees': {filter: {category: ['Trees']}, title: 'Bushes & Trees'},
    dresses: {filter: {category: ['Dresses']}},
    fish: {filter: {category: ['Fish']}},
    flooring: {filter: {category: ['Flooring']}},
    flowers: {filter: {category: ['Flowers']}},
    fossils: {filter: {category: ['Fossils']}},
    fruit: {filter: {category: ['Fruit']}},
    furniture: {filter: {category: ['Furniture']}},
    gyroids: {filter: {category: ['Gyroids']}},
    hats: {filter: {category: ['Hats']}},
    music: {filter: {category: ['Music']}},
    mushrooms: {filter: {category: ['Mushrooms']}},
    ore: {filter: {category: ['Ore']}},
    shoes: {filter: {category: ['Shoes']}},
    socks: {filter: {category: ['Socks']}},
    stationery: {filter: {category: ['Stationery']}},
    tools: {filter: {category: ['Tools']}},
    tops: {filter: {category: ['Tops']}},
    umbrellas: {filter: {category: ['Umbrellas']}},
    usables: {filter: {category: ['Usables']}},
    wallpaper: {filter: {category: ['Wallpaper']}},
    wetsuits: {filter: {category: ['Wetsuits']}},

    // Home page summary filters
    clothing: {filter: {category: ['Accessories', 'Bottoms', 'Dresses', 'Hats', 'Shoes', 'Socks', 'Tops',
            'Umbrellas', 'Wetsuits']}},
    collectibles: {filter: {category: ['Art', 'Bugs', 'Fish', 'Fossils']}},
    equipment: {filter: {category: ['Balloons', 'Stationery', 'Usables', 'Tools']}},
    'all-furniture': {filter: {category: ['Flooring', 'Furniture', 'Music', 'Wallpaper']}, title: 'All Furniture'},
    nature: {filter: {category: ['Bushes & Trees', 'Flowers', 'Fruit', 'Gyroids', 'Mushrooms', 'Ore']}}
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
            categories[slug].title ? categories[slug].title : format.capFirstLetter(slug),
            req.query,
            categories[slug].filter,
            data);
    });
}

module.exports = router;