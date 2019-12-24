const villagers = require('../db/entity/villagers');
const items = require('../db/entity/items');
const urlHelper = require('../helpers/url');

/**
 * Make a random number that is at most max. This is not cryptographically secure in any way, but we don't need that.
 *
 * @param max
 * @returns {number}
 */
function maxRandom(max) {
    const val = Math.floor(Math.random() * max);
    return val >= 1 ? val : 1;
}

/**
 * Randomly redirect to some item in the given collection. If for some reason we don't get a result, we redirect to
 * the home page which is pretty safe.
 *
 * @param res
 * @param collection
 * @param entityType
 */
async function redirectRandomly(res, collection, entityType) {
    const v = maxRandom(await collection.count());
    const result = await collection.getByRange(v, v);
    if (result.length > 0) {
        res.redirect(302, urlHelper.getEntityUrl(entityType, result[0].id));
    } else {
        res.redirect(302, '/');
    }
}

const express = require('express');
const router = express.Router();

router.get('/villager', (req, res, next) => {
    redirectRandomly(res, villagers, 'villager')
        .catch(next);
});

router.get('/item', (req, res, next) => {
    redirectRandomly(res, items, 'item')
        .catch(next);
});

module.exports = router;