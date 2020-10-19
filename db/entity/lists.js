const mongo = require('../mongo');

/**
 * Lists repository.
 */
class Lists {
    /**
     * Build the Lists class taking in the MongoDatabase object.
     *
     * @param db
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Create a new list.
     *
     * @param username
     * @param listName
     * @param listCategory
     * @returns {Promise<*>}
     */
    async createList(username, listId, listName, listCategory) {
        const villagerDb = await this.db.get();

        await villagerDb.collections('lists')
            .insertOne({
                username: username,
                id: listId,
                name: listName,
                category: listCategory,
                entities: []
            });
    }

    /**
     * Rename the list of user (id) from its old id (listId) to its new id (newListId) and new name (newListName).
     *
     * @param username
     * @param listId
     * @param newListId
     * @param newListName
     * @param newListCategory
     * @returns {Promise<void>}
     */
    async updateList(username, listId, newListId, newListName, newListCategory) {
        const villagerDb = await this.db.get()

        await villagerDb.collection('lists')
            .updateOne({
                username: username,
                id: listId
            },
            {
                $set: {
                    id: newListId,
                    name: newListName,
                    category: newListCategory
                }
            });
    }

    /**
     * Add an entity to an existing list.
     *
     * @param username
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async addEntityToList(username, listId, entityId, type, variationId) {
        const villagerDb = await this.db.get();
        const store = {
            id: entityId,
            variationId: variationId,
            type: type
        };

        await villagerDb.collection('lists')
            .updateOne({
                    username: username,
                    id: listId
                },
                {
                    $addToSet: {
                        entities: store
                    }
                });
    }

    /**
     * Add an entire set of entities to a list.
     *
     * @param username
     * @param listId
     * @param items
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async importItemsToList(username, listId, items) {
        const villagerDb = await this.db.get();
        let itemArray = [];

        for (let entity in items) {
            itemArray.push({
                id: entity,
                variationId: null,
                type: "item"
            });
        }

        await villagerDb.collection('lists')
            .updateOne({
                    username: username,
                    id: listId
                },
                {
                    $set: {
                        entities: itemArray
                    }
                });
    }

    /**
     * Remove an entity from an existing list.
     *
     * @param username
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async removeEntityFromList(username, listId, entityId, type, variationId) {
        const villagerDb = await this.db.get();

        await villagerDb.collection('lists')
            .updateOne({
                    uesrname: username,
                    id: listId
                },
                {
                    $pull: {
                        entities: {
                            id: entityId,
                            type: type,
                            variationId: variationId
                        }
                    }
                });
    }

    /**
     * Set the text for an entity
     *
     * @param username
     * @param listId
     * @param entityId
     * @param type
     * @param variationId
     * @param text
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async setEntityText(username, listId, entityId, type, variationId, text) {
        const villagerDb = await this.db.get();
        await villagerDb.collection('users')
            .updateOne({
                    username: username,
                    id: listId,
                },
                {
                    $set: {
                        "entities.$[entity].text": text
                    },
                },
                {
                    arrayFilters: [
                        {
                            'entity.id': entityId,
                            'entity.type': type,
                            'entity.variationId': variationId
                        }
                    ]
                });
    }

    /**
     * Find a list by its id.
     *
     * @param username
     * @param listId
     * @returns {Promise<*>}
     */
    async getListById(username, listId) {
        const villagerDb = await this.db.get();

        const cursor = await villagerDb.collection('users')
            .findOne({
                    username: username
                },
                {
                    projection: {
                        lists: 1,
                        _id: 0
                    }
                });

        // Grab the list they want.
        if (cursor && cursor.lists) {
            for (let list of cursor.lists) {
                if (list.id === listId) {
                    return list;
                }
            }
        }
    }

    /**
     * Get all lists by a specific user using their id.
     *
     * @param id
     * @returns {Promise<[]>}
     */
    async getListsByUser(id) {
        const villagerDb = await this.db.get();
        const cursor = await villagerDb.collection('users')
            .findOne({
                _id: id
            },
            {
                projection: {
                    lists: 1, _id: 0
                }
            });

        // Make sure the user exists and then return their lists, if defined.
        if (cursor && cursor.lists) {
            return cursor.lists;
        }
    }

    /**
     * Delete a list by its name.
     *
     * @param id
     * @param listId
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async deleteList(id, listId) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .updateOne({
                    _id: id
                },
                {
                    $pull: {
                        lists: {
                            id: listId
                        }
                    }
                });
    }
}

module.exports = new Lists(mongo);