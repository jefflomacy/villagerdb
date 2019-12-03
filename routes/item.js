const express = require('express');
const format = require('../helpers/format.js');
const items = require('../db/entity/items');

/**
 * Load the specified item.
 *
 * @param id
 * @returns {Promise<{}>}
 */
async function loadItem(id) {
    // Load item
    const item = await items.getById(id);
    if (!item) {
        let e = new Error('Item not found');
        e.status = 404;
        throw e;
    }

    // Build page data.
    const result = {};

    // Some extra metadata the template needs.
    result.pageTitle = item.name;

    // Social media information
    result.shareUrl = encodeURIComponent('https://villagerdb.com/item/' + item.id);

    // Images.
    result.image = item.image;

    return result;
}

const router = express.Router();
router.get('/:id', function (req, res, next) {
    loadItem(req.params.id)
        .then((data) => {
            res.render('item', data);
        }).catch(next);
});

module.exports = router;
