const mongo = require('../mongo');
const format = require('../../helpers/format');

/**
 * Lists repository.
 */
class Lists {

    /**
     * Build the Lists class taking in the MongoDatabase object and a database name.
     *
     * @param db
     * @param dbName
     */
    constructor(db, dbName) {
        this.db = db;
        this.dbName = dbName;
    }

    /**
     * Create a new list.
     *
     * @param googleId
     * @param listName
     * @returns {Promise<*>}
     */
    async createList(googleId, listName) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const listId = format.getSlug(listName);
        const newList = {
            name: listName,
            id: listId,
            entities: []
        };

        await villagerDb.collection('users').updateOne(
            { googleId: googleId },
            { $addToSet: { lists: newList } } );

        return await villagerDb.collection('users').findOne( { name: listName } );
    }

    /**
     * Add an entity to an existing list.
     *
     * @param googleId
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async addEntityToList(googleId, listId, entityId, type) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const store = {
            entityId: entityId,
            type: type
        };

        return villagerDb.collection('users').updateOne(
            { "googleId": googleId, "lists.id": listId },
            {
                $addToSet:
                    {
                        "lists.$.entities": store
                    }
            }
        );
    }

    /**
     * Remove an entity from an existing list.
     *
     * @param googleId
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async removeEntityFromList(googleId, listId, entityId, type) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        return villagerDb.collection('users').updateOne(
            { "googleId": googleId, "lists.id": listId },
            {
                $pull:
                    {
                        "lists.$.entities": { "entityId": entityId }
                    }
            }
        );
    }

    /**
     * Find a list by its id.
     *
     * @param googleId
     * @param listId
     * @returns {Promise<*>}
     */
    async getListById(googleId, listId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const cursor = await villagerDb.collection('users').findOne(
            { googleId: googleId },
            { projection: { lists: 1, _id: 0 } }
        );
        let list;
        cursor.lists.some((listIndex) => {
            if (listIndex.id === listId) {
                list = listIndex;
            }
        });
        return list;
    }

    /**
     * Get all lists by a specific user using their google id.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async getListsByUser(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        const cursor = await villagerDb.collection('users').findOne(
            { googleId: googleId }, { projection: { lists: 1, _id: 0 } } );
        return cursor.lists;
    }

    /**
     * Delete a list by its name.
     *
     * @param googleId
     * @param listId
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async deleteList(googleId, listId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return villagerDb.collection('users').updateOne(
            { googleId: googleId },
            { $pull:
                    { "lists": { id: listId } }
            }

        );
    }

    /**
     * Method for validating if a list already exists.
     *
     * @param googleId
     * @param listId
     * @returns {Promise<boolean>}
     */
    async listAlreadyExists(googleId, listName) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const cursor = await villagerDb.collection('users').findOne(
            { googleId: googleId },
            { projection: { lists: 1, _id: 0 } }
        );
        let listExists = false;
        if (cursor.lists != null) {
            cursor.lists.some((listIndex) => {
                if (listIndex.name === listName) {
                    listExists = true;
                }
            });
        }

        return listExists;
    }

}

module.exports = new Lists(mongo, process.env.DB_NAME);