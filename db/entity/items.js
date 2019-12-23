const path = require('path');
const RedisStore = require('./redis-store');
const redisConnection = require('../redis');
const urlHelper = require('../../helpers/url');

class Items extends RedisStore {
    constructor() {
        super(redisConnection, 'items', 'item', path.join('data', 'items'));
    }

    async _afterPopulation() {
        const count = await this.count();
        const items = await this.getByRange(0, count);

        // Process items.
        for (let item of items) {
            await this.formatRecipe(item);
            await this.updateEntity(item.id, item);
        }
    }

    /**
     * Recipe formatting entry point - New Horizons only
     *
     * @param item
     * @returns {Promise<void>}
     */
    async formatRecipe(item) {
        if (item.games.nh && item.games.nh.recipe) {
            item.games.nh.normalRecipe = await this.buildRecipeArrayFromMap(item.games.nh.recipe);
            item.games.nh.fullRecipe = await this.buildRecipeArrayFromMap(
                await this.buildFullRecipe(item.games.nh.recipe)
            );
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
     * @param map
     * @param outputMap
     * @returns {Promise<*>}
     */
    async buildFullRecipe(map, outputMap = {}) {
        // For every non-base item, call ourselves. For every base item, add it to the output map.
        for (let ingredient of Object.keys(map)) {
            // Is it an ingredient item that has a recipe?
            const ingredientItem = await this.getById(ingredient);
            if (ingredientItem && ingredientItem.games.nh && ingredientItem.games.nh.recipe) {
                // Yes. Call ourselves.
                await this.buildFullRecipe(ingredientItem.games.nh.recipe, outputMap);
            } else {
                // No. Base case. Add the numbers up.
                if (typeof outputMap[ingredient] !== 'undefined') {
                    outputMap[ingredient] += map[ingredient];
                } else {
                    outputMap[ingredient] = map[ingredient];
                }
            }
        }

        return outputMap;
    }
}

module.exports = new Items();