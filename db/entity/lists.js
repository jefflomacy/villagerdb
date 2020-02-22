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
     * @param id
     * @param listName
     * @returns {Promise<*>}
     */
    async createList(id, listId, listName) {
        const villagerDb = await this.db.get();

        const newList = {
            name: listName,
            id: listId,
            entities: []
        };

        await villagerDb.collection('users')
            .updateOne({
                    _id: id
                },
                {
                    $addToSet: {
                        lists: newList
                    }
                });

        return await villagerDb.collection('users')
            .findOne({
                name: listName
            });
    }

    /**
     * Add an entity to an existing list.
     *
     * @param id
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async addEntityToList(id, listId, entityId, type) {
        const villagerDb = await this.db.get();

        const store = {
            id: entityId,
            type: type
        };

        return villagerDb.collection('users')
            .updateOne({
                    _id: id,
                    "lists.id": listId
                },
                {
                    $addToSet: {
                        "lists.$.entities": store
                    }
                });
    }

    /**
     * Remove an entity from an existing list.
     *
     * @param id
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async removeEntityFromList(id, listId, entityId, type) {
        const villagerDb = await this.db.get();

        return villagerDb.collection('users')
            .updateOne({
                    _id: id,
                    "lists.id": listId
                },
                {
                    $pull: {
                        "lists.$.entities": { "id": entityId }
                    }
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

        // TODO: Refactor to use mongo indexing.
        let list = undefined;
        cursor.lists.some((listIndex) => {
            if (listIndex.id === listId) {
                list = listIndex;
            }
        });
        return list;
    }

    /**
     * Get all lists by a specific user using their id.
     *
     * @param id
     * @returns {Promise<*>}
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
        return cursor.lists;
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

    /**
     * Method for validating if a list already exists.
     *
     * @param id
     * @param listId
     * @returns {Promise<boolean>}
     */
    async listAlreadyExists(id, listId) {
        const villagerDb = await this.db.get();

        const cursor = await villagerDb.collection('users')
            .findOne({
                    _id: id
                },
                {
                    projection: {
                        lists: 1,
                        _id: 0
                    }
                });

        // TODO: Refactor to use Mongo indexing
        let listExists = false;
        if (cursor.lists != null) {
            cursor.lists.some((listIndex) => {
                if (listIndex.id === listId) {
                    listExists = true;
                }
            });
        }

        return listExists;
    }

}

module.exports = new Lists(mongo);