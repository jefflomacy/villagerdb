const path = require('path');
const fs = require('fs');
const RedisStore = require('./redis-store');
const redisConnection = require('../redis');
const urlHelper = require('../../helpers/url');
const villagers = require('./villagers');

class Items extends RedisStore {
    constructor() {
        super(redisConnection, 'items', 'item', path.join('data', 'items'));
    }

    /**
     * Custom post-processing logic for each item.
     *
     * @param item
     * @returns {{}}
     * @private
     */
    _handleEntity(item) {
        this.collapseVariations(item);
        return item;
    }

    async _afterPopulation() {
        // We need all the villager IDs.
        const villagersCount = await villagers.count();
        const villagersList = await villagers.getByRange(0, villagersCount);

        const count = await this.count();
        const items = await this.getByRange(0, count);

        // Process items.
        for (let item of items) {
            await this.buildOwnersArray(item, villagersList);
            await this.formatRecipe(item);
            await this.updateEntity(item.id, item);
        }
    }

    /**
     * Loop through villagers and find villagers who own this item.
     *
     * @param item
     * @param villagersList
     * @returns {Promise<void>}
     */
    async buildOwnersArray(item, villagersList) {
        item.owners = [];

        // Loop through each villager and the games they're in and see if we are their clothing item.
        for (let villager of villagersList) {
            const ownerTracker = [];
            for (let gameId in villager.games) {
                if (villager.games[gameId].clothes === item.id && !ownerTracker.includes(villager.id)) {
                    ownerTracker.push(villager.id);
                    item.owners.push({
                        name: villager.name,
                        url: urlHelper.getEntityUrl(urlHelper.VILLAGER, villager.id)
                    });
                }
            }
        }

        // Sort array by name
        item.owners.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            } else if (a.name < b.name) {
                return -1;
            }

            return 0;
        });
    }

    /**
     * Recipe formatting entry point - New Horizons only
     *
     * @param item
     * @returns {Promise<void>}
     */
    async formatRecipe(item) {
        if (item.games.nh && item.games.nh.recipe) {
            console.log('Formatting recipe for ' + item.id);

            try {
                item.games.nh.normalRecipe = await this.buildRecipeArrayFromMap(item.games.nh.recipe);
                item.games.nh.fullRecipe = await this.buildRecipeArrayFromMap(
                    await this.buildFullRecipe(item.games.nh.recipe)
                );
            } catch (e) {
                console.error('Problem while recipe formatting for item: ' + item.id);
                console.error(e);
                throw e; // re-throw
            }

        }
    }

    /**
     * Turns a JSON item of {ingredient: count} lists into an array more suitable for frontend use. We compute this
     * data here instead of in, say, a router, because it's expensive to do.
     *
     * @param map
     * @returns {Promise<[]>}
     */
    async buildRecipeArrayFromMap(map) {
        const recipeArray = [];
        const ingredients = Object.keys(map).sort();
        for (let ingredient of ingredients) {
            let name = ingredient;
            let url = undefined;

            // Is it an item? If so, update the above name and url.
            const ingredientItem = await this.getById(ingredient);
            if (ingredientItem) {
                name = ingredientItem.name;
                url = urlHelper.getEntityUrl(urlHelper.ITEM, ingredientItem.id);
            } else {
                // This is a serious failure. Cancel indexing.
                throw new Error('Invalid ingredient id: ' + ingredient);
            }

            // Make sure the map contains a number.
            if (typeof map[ingredient] !== 'number' || isNaN(map[ingredient])) {
                // Another serious failure. Stop indexing.
                throw new Error('Ingredient item ' + ingredient + ' is not a number: ' + map[ingredient]);
            }
            
            recipeArray.push({
                name: name,
                url: url,
                count: map[ingredient]
            });
        }

        return recipeArray;
    }

    /**
     * Builds a full recipe list from a map by recursively following the map down until only base items are in the
     * list of items.
     *
     * @param map the original input recipe
     * @param outputMap the final result computed along the way
     * @param seenIds ids we've already dived into to prevent re-looping
     * @param itemMultiplier for non-base-case items, how many are required
     * @returns {Promise<*>}
     */
    async buildFullRecipe(map, outputMap = {}, seenIds = {}, itemMultiplier = 1) {
        // For every non-base item, call ourselves. For every base item, add it to the output map.
        for (let ingredient of Object.keys(map)) {
            // Is it an ingredient item that has a recipe?
            const ingredientItem = await this.getById(ingredient);
            if (ingredientItem && ingredientItem.games.nh && ingredientItem.games.nh.recipe
                && !seenIds[ingredient]) {
                // Yes. Call ourselves after making sure we prevent an infinite loop.
                seenIds[ingredient] = true; // mark it as seen
                await this.buildFullRecipe(ingredientItem.games.nh.recipe, outputMap, seenIds, map[ingredient]);
            } else {
                // No. Base case. Add the numbers up.
                if (typeof outputMap[ingredient] !== 'undefined') {
                    outputMap[ingredient] += map[ingredient] * itemMultiplier;
                } else {
                    outputMap[ingredient] = map[ingredient] * itemMultiplier;
                }
            }
        }

        return outputMap;
    }

    /**
     * Variations are stored at the game level in the dataset, but where we really need them is at the root of the
     * object for easy retrieval at runtime.
     *
     * @param item
     */
    collapseVariations(item) {
        console.log('Collapsing variations for ' + item.id);
        const variations = {};
        for (let gameId in item.games) {
            const game = item.games[gameId];
            if (typeof game.variations !== 'undefined') {
                Object.assign(variations, game.variations);
            }
        }

        // Only allow variations selection if more than one variant exists.
        if (Object.keys(variations).length < 2) {
            return;
        }

        // Sort before assignment.
        const variationsSorted = {};
        const keys = Object.keys(variations).sort((a, b) => {
            if (variations[a] > variations[b]) {
                return 1;
            } else if (variations[a] < variations[b]) {
                return -1;
            }

            return 0;
        });
        for (let k of keys) {
            variationsSorted[k] = variations[k];
        }

        // Assign variations.
        item.variations = variationsSorted;

        // Now let's take a look at variation images.
        item.variationImages = {};
        for (let k of keys) {
            let imageData = urlHelper.getEntityImageData(this.entityType, item.id, k, false);
            // use base images if no variation image available.
            if (!imageData.thumb) {
                imageData.thumb = item.image.thumb;
            }
            if (!imageData.medium) {
                imageData.medium = item.image.medium;
            }
            if (!imageData.full) {
                imageData.full = item.image.full;
            }
            item.variationImages[k] = imageData;
        }
    }
}

module.exports = new Items();