const path = require('path');
const RedisStore = require('./redis-store');
const redisConnection = require('../redis');
const urlHelper = require('../../helpers/url');

class Villagers extends RedisStore {
    constructor() {
        super(redisConnection, 'villagers', 'villager', path.join('data', 'villagers'));
    }

    async _afterPopulation() {
        const count = await this.count();
        const villagers = await this.getByRange(0, count);

        // Process villagers.
        for (let villager of villagers) {
            await this.associateClothes(villager);
            await this.updateEntity(villager.id, villager);
        }
    }

    /**
     * Build a link to the clothes item for each game the villager is a part of.
     *
     * @param villager
     * @returns {Promise<void>}
     */
    async associateClothes(villager) {
        // For each game, associate the clothes if possible.
        for (let gameId in villager.games) {
            const clothingId = villager.games[gameId].clothes;
            if (clothingId) {
                // Does this clothing item exist?
                const clothingItem = this._loadData('item', clothingId);
                if (clothingItem) {
                    // Make a link to it.
                    villager.games[gameId].clothesName = clothingItem.name;
                    villager.games[gameId].clothesUrl = urlHelper.getEntityUrl(urlHelper.ITEM, clothingItem.id);
                } else {
                    // No link, just use the name as given.
                    villager.games[gameId].clothesName = villager.games[gameId].clothes;
                }
            }
        }
    }
}

module.exports = new Villagers();