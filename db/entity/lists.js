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
        await villagerDb.collection('lists').insertOne( { googleId: googleId, name: listName, id: listId, entities: [] } );

        return await villagerDb.collection('lists').findOne( { name: listName } );
    }

    /**
     * Add an entity to an existing list.
     *
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async addEntityToList(listId, entityId, type) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const store = {
            entityId: entityId,
            type: type
        };

        return villagerDb.collection('lists').updateOne(
            { id: listId },
            { $addToSet: { entities: store } }
        );
    }

    /**
     * Remove an entity from an existing list.
     *
     * @param listId
     * @param entityId
     * @param type
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async removeEntityFromList(listId, entityId, type) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        const store = {
            entityId: entityId,
            type: type
        };

        return villagerDb.collection('lists').updateOne(
            { id: listId },
            { $pull: { entities: store } }
        );
    }

    /**
     * Find a list by its id.
     *
     * @param listId
     * @returns {Promise<*>}
     */
    async getListById(listId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        return await villagerDb.collection('lists').findOne( { id: listId } );
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
        const cursor = villagerDb.collection('lists').find( { googleId: googleId } );
        return await cursor.toArray();
    }

    /**
     * Delete a list by its name.
     *
     * @param listId
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async deleteList(listId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('lists').deleteOne( { id: listId } );
    }

    /**
     * Delete all lists associated with a specific google id.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async deleteListsByUser(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('lists').deleteOne( { googleId: googleId } );
    }

}

module.exports = new Lists(mongo, process.env.DB_NAME);