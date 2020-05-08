const express = require('express');
const format = require('../helpers/format.js');
const items = require('../db/entity/items');

/**
 * Get values for a specified currency from a game object's list of prices. The result is not sorted.
 *
 * @param elements
 * @param currency
 * @returns {*}
 */
function getCurrencyValues(elements, currency) {
    return elements
        .filter((p) => {
            return p.currency === currency;
        })
        .map((p) => {
            return p.value;
        })
}

/**
 * Build paragraph for item.
 *
 * @param item
 * @param formatData
 * @returns {string}
 */
function generateParagraph(item, formatData) {
    // Find the latest game the item is in or give up and return nothing.
    let latestGameId = undefined;
    let latestFormatData = undefined;
    for (let gameId in format.games) {
        if (item.games[gameId]) {
            latestFormatData = formatData.gamesData[gameId];
            latestGameId = gameId;
            break;
        }
    }
    if (!latestFormatData) {
        return '';
    }

    const gameList = Object.values(formatData.gamesData)
        .map((d) => {
            return d.gameTitle
        });

    let paragraph = item.name + ' can be found in ' + format.andList(gameList) + '. ';
    if (typeof latestFormatData.orderable !== 'undefined') {
        paragraph += 'You ' + (latestFormatData.orderable ? 'can' : 'cannot') + ' order it from the catalog. ';
    }

    if (typeof latestFormatData.customizable !== 'undefined') {
        paragraph += 'It ' + (latestFormatData.customizable ? 'can': 'cannot') + ' be customized. ';
    }

    // Fashion and interior themes.
    if (latestFormatData.hasFashionTheme) {
        paragraph += 'This item fits the ' +
            format.andList(latestFormatData.fashionTheme).toLowerCase() + ' fashion theme' +
                (latestFormatData.fashionTheme.length > 1 ? 's' : '') + '. ';
    }
    if (latestFormatData.hasInteriorTheme) {
        paragraph += 'The interior theme' + (latestFormatData.interiorTheme.length > 1 ? 's for this item are '
            : ' for this item is ') + format.andList(latestFormatData.interiorTheme).toLowerCase() + '. ';
    }

    // Set
    if (latestFormatData.hasSet) {
        paragraph += 'This item is a part of the ' + latestFormatData.set.toLowerCase() + ' set.';
    }

    return paragraph.trim();
}

/**
 * Format an item for the front end.
 * @param item
 */
function formatItem(item) {
    const formatted = {};

    // Game tables
    formatted.gamesData = {};
    for (let gameId in format.games) {
        const game = item.games[gameId];
        if (game) {
            // Where to get?
            let source = [];
            if (game.sources) {
                source = source.concat(game.sources);
                source.sort();
            }

            // Gather purchase information.
            let bellCost = [];
            let meowCost = [];
            let milesCost = [];
            if (game.buyPrices) {
                bellCost = bellCost.concat(getCurrencyValues(game.buyPrices, 'bells'));
                meowCost = meowCost.concat(getCurrencyValues(game.buyPrices, 'meow'));
                milesCost = milesCost.concat(getCurrencyValues(game.buyPrices, 'miles'));
                bellCost.sort();
                meowCost.sort();
            }

            // Gather sale information.
            const bellPrice = [];
            if (game.sellPrice && game.sellPrice.currency === 'bells') {
                bellPrice.push(game.sellPrice.value);
            }

            // Fashion and interior theme (if defined)
            let fashionTheme = [];
            let interiorTheme = [];
            if (game.fashionThemes) {
                fashionTheme = fashionTheme.concat(game.fashionThemes);
                fashionTheme.sort();
            }
            if (game.interiorThemes) {
                interiorTheme = interiorTheme.concat(game.interiorThemes);
                interiorTheme.sort();
            }

            // Formatted data.
            formatted.gamesData[gameId] = {
                gameTitle: format.games[gameId].title,
                orderable: game.orderable,
                orderableText: typeof game.orderable !== 'undefined' ? (game.orderable ? 'Yes' : 'No') : undefined,
                customizable: game.customizable,
                customizableText: typeof game.customizable !== 'undefined' ? (game.customizable ? 'Yes' : 'No') : undefined,
                sizeText: game.xSize > 0 && game.ySize > 0 ? (game.xSize + ' x ' + game.ySize) : undefined,
                hasSource: source.length > 0,
                source: source,
                buyable: bellCost.length > 0 || meowCost.length > 0 || milesCost.length > 0,
                bellCost: bellCost,
                meowCost: meowCost,
                milesCost: milesCost,
                sellable: bellPrice.length > 0,
                bellPrice: bellPrice,
                hasFashionTheme: fashionTheme.length > 0,
                fashionTheme: fashionTheme,
                hasInteriorTheme: interiorTheme.length > 0,
                interiorTheme: interiorTheme,
                hasSet: typeof game.set !== 'undefined',
                hasRecipe: typeof game.recipe !== 'undefined',
                normalRecipe: game.normalRecipe,
                fullRecipe: game.fullRecipe,
                set: game.set
            };
        }
    }

    // Paragraph and variations
    formatted.paragraph = generateParagraph(item, formatted);
    formatted.variations = JSON.stringify(typeof item.variations === 'object' ? item.variations : {});
    formatted.variationImages = JSON.stringify(typeof item.variationImages === 'object' ? item.variationImages
        : {});
    return formatted;
}

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
    result.id = id;
    Object.assign(result, formatItem(item));
    result.games = Object.values(result.gamesData);

    // Some extra metadata the template needs.
    result.pageTitle = item.name;
    result.category = item.category;

    // Images.
    result.image = item.image;
    result.serializedImages = JSON.stringify(item.image);

    // Ownership data
    result.hasOwnership = typeof item.owners !== 'undefined' && item.owners.length > 0;
    result.owners = item.owners;

    // Dependents data.
    result.dependents = item.recipeDependents;
    result.dependentsCount = typeof item.recipeDependents === 'object' ? result.dependents.length : 0;
    result.hasDependents = result.dependentsCount > 0;
    result.recipesText = 'recipe' + (result.dependentsCount > 1 ? 's' : '');

    // Social media information
    result.pageUrl = 'https://villagerdb.com/item/' + item.id;
    result.pageDescription = result.paragraph;
    result.pageImage = 'https://villagerdb.com' + result.image.full;
    result.shareUrl = 'https://villagerdb.com/item/' + item.id;

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
