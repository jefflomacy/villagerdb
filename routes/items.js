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
 * Bushes and trees are used twice - once at /bushes and again at /bushes-trees
 * @type {{}}
 */
const bushesAndTreesDefinition = {
    filter: {
        category: ['Bushes and Trees']
    },
    pageTitle: 'Bushes & Trees',
    pageDescription: 'All plantable bushes and trees that do not bear fruit.'
};

/**
 * Map of URL slug to fixed query parameter to ElasticSearch.
 * @type {{}}
 */
const categories = {
    accessories: {
        filter: {
            category: ['Accessories']
        },
        pageDescription: 'Accessories are things you can wear on your head that are not a hat! Such as a bandage, a ' +
            ' king\'s beard, or a pair of glasses.'
    },
    art: {
        filter: {
            category: ['Art']
        },
        pageDescription: 'Art includes paintings and statues you can donate to the museum. If you happen to run ' +
            'across a genuine piece from Crazy Redd, that is.'
    },
    balloons: {
        filter: {
            category: ['Balloons']
        },
        pageDescription: 'Balloons are items you can hold that serve no other purpose than looking cool. Be careful ' +
            'how you handle them, or they might pop!'
    },
    bottoms: {
        filter: {
            category: ['Bottoms']
        },
        pageDescription: 'Pants to fit every lifestyle.'
    },
    bugs: {
        filter: {
            category: ['Bugs']
        },
        pageDescription: 'Flying, creeping and crawling; all of the bugs you need are here.'
    },
    bushes: bushesAndTreesDefinition, // kept around to prevent 404
    'bushes-trees': bushesAndTreesDefinition,
    diy: {
        filter: {
            tag: ['Craftable']
        },
        pageTitle: 'DIYs',
        pageDescription: 'This category includes all items you can craft in New Horizons.'
    },
    dresses: {
        filter: {
            category: ['Dresses']
        },
        pageDescription: 'All dresses from the Animal Crossing games, from cute, to fashionable, to formal.'
    },
    fish: {
        filter: {
            category: ['Fish']
        },
        pageDescription: 'All of Blathers\'s favorite meals are on display in this category.'
    },
    flooring: {
        filter: {
            category: ['Flooring']
        },
        pageDescription: 'Rugs, tiled floors and more.'
    },
    flowers: {
        filter: {
            category: ['Flowers']
        },
        pageDescription: 'Flowers can be found here.'
    },
    fossils: {
        filter: {
            category: ['Fossils']
        },
        pageDescription: 'Fossils, assessed by Blathers and/or the Faraway Museum, are dug up from the ground and ' +
            'either donated to the museum or sold to Re-Tail (New Leaf) and/or Tom Nook (City Folk, Wild World, ' +
            'Animal Crossing).'
    },
    fruit: {
        filter: {
            category: ['Fruit']
        },
        pageDescription: 'Plantable fruits can be found in this category.'
    },
    furniture: {
        filter: {
            category: ['Furniture']
        },
        pageTitle: 'Indoor/Outdoor Items',
        pageDescription: 'All indoor (New Leaf and earlier) games and outdoor (New Horizons) furniture.'
    },
    gyroids: {
        filter: {
            category: ['Gyroids']
        },
        pageDescription: 'Beeping, booping, bopping, screeching, belching, buzzing and gyrating Gryoids.'
    },
    hats: {
        filter: {
            category: ['Hats']
        },
        pageDescription: 'Things you wear on your head that are not accessories.'
    },
    music: {
        filter: {
            category: ['Music']
        },
        pageDescription: 'The complete discography of everyone\'s favorite musician, K.K. Slider.'
    },
    mushrooms: {
        filter: {
            category: ['Mushrooms']
        },
        pageDescription: 'Mushrooms can be picked from the ground in the fall. Sometimes, you will find pieces of ' +
            'the mushroom furniture set instead of a mushroom!'
    },
    ore: {
        filter: {
            category: ['Ore']
        },
        pageDescription: 'In New Leaf, there is one fake rock in your town per day. Break it to reveal an ore! With ' +
            'a silver shovel or better, sometimes the daily money rock will reward you with ores instead.'
    },
    photos: {
        filter: {
            category: ['Photos']
        },
        pageTitle: 'Photos and posters',
        pageDescription: 'Photos and posters of your favorite villagers.'
    },
    shoes: {
        filter: {
            category: ['Shoes']
        },
        pageDescription: 'Shoes go on your feet!'
    },
    socks: {
        filter: {
            category: ['Socks']
        },
        pageDescription: 'Socks are a comfortable thing to wear on your feet with shoes.'
    },
    stationery: {
        filter: {
            category: ['Stationery']
        },
        pageDescription: 'Do you consider yourself a good writer? Well, you\'ll be using lots of stationery then.'
    },
    tools: {
        filter: {
            category: ['Tools']
        },
        pageDescription: 'Tools let you dig, hit rocks, catch fish and insects, chop down trees and bamboo, and ' +
            'nets let you torment your villagers.'
    },
    tops: {
        filter: {
            category: ['Tops']
        },
        pageDescription: 'Tops are all shirts that do not qualify as dresses.'
    },
    umbrellas: {
        filter: {
            category: ['Umbrellas']
        },
        pageDescription: 'Unless you\'re a frog, you\'ll want an umbrella in the rain.'
    },
    usables: {
        filter: {
            category: ['Usables']
        },
        pageDescription: 'Usables consist of all consumable items that are not fruit, such as fertilizer.'
    },
    wallpaper: {
        filter: {
            category: ['Wallpaper']
        },
        pageDescription: 'Make your house look like a 1970\'s diner or a futuristic laboratory. It\'s all about the ' +
            'wallpaper.'
    },
    wetsuits: {
        filter: {
            category: ['Wetsuits']
        },
        pageDescription: 'Wetsuits let you do deep diving to catch ocean creatures.'
    },

    // Home page summary filters
    clothing: {
        filter: {
            category: ['Accessories', 'Bottoms', 'Dresses', 'Hats', 'Shoes', 'Socks', 'Tops',
                'Umbrellas', 'Wetsuits']
        },
        pageDescription: 'Clothing includes accessories, bottoms, dresses, hats, shoes, socks, tops, ' +
            'umbrellas and wetsuits.'
    },
    collectibles: {
        filter: {
            category: ['Art', 'Bugs', 'Fish', 'Fossils']
        },
        pageDescription: 'Collectibles include art, bugs, fish, and fossils.'
    },
    equipment: {
        filter: {
            category: ['Balloons', 'Stationery', 'Usables', 'Tools']
        },
        pageDescription: 'Equipment includes balloons, stationery, usables and tools.'
    },
    'all-furniture': {
        filter: {
            category: ['Flooring', 'Furniture', 'Music', 'Wallpaper']
        },
        pageTitle: 'All Furniture',
        pageDescription: 'This top-level furniture category includes flooring, indoor/outdoor furniture, music and ' +
            'wallpaper.'
    },
    nature: {
        filter: {
            category: ['Bushes & Trees', 'Flowers', 'Fruit', 'Gyroids', 'Mushrooms', 'Ore']
        },
        pageDescription: 'The nature category includes bushes & trees, flowers, fruit, gyroids, mushrooms and ore.'
    }
};

/**
 * Invokes the browser.
 * @param req
 * @param res
 * @param next
 * @param slug
 */
function callBrowser(req, res, next, slug) {
    const data = {};
    const pageNumber = req.params ? req.params.pageNumber : undefined;
    const pageNumberInt = sanitize.parsePositiveInteger(pageNumber);

    // Social media information
    data.pageUrl = 'https://villagerdb.com/items/' + slug +
        (typeof pageNumber !== 'undefined' ? '/page/' + pageNumberInt : '');
    data.pageDescription = categories[slug].pageDescription;
    data.shareUrl = encodeURIComponent(data.pageUrl);

    browse(res, next, pageNumberInt,
        '/items/' + slug + '/page/',
        categories[slug].pageTitle ? categories[slug].pageTitle : format.capFirstLetter(slug),
        req.query,
        categories[slug].filter,
        data);
}

/**
 *
 * @type {Router}
 */
const router = express.Router();

// Build the URLs based on the slugs above.
for (let slug in categories) {
    router.get('/' + slug, (req, res, next) => {
        callBrowser(req, res, next, slug);
    });

    router.get('/' + slug + '/page/:pageNumber', (req, res, next) => {
        callBrowser(req, res, next, slug);
    });
}

module.exports = router;