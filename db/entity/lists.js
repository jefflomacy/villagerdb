const mongo = require('../mongo');
const ObjectId = require('mongodb').ObjectID;

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
     * @param items
     * @returns {Promise<*>}
     */
    async createList(googleId, listName) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        await villagerDb.collection('lists').insertOne( { googleId: googleId, name: listName } );
        return await villagerDb.collection('lists').findOne( { name: listName } );
    }

    /**
     * Add an item to an existing list.
     *
     * @param listName
     * @param itemId
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async addItemToList(listName, itemId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);

        return villagerDb.collection('lists').updateOne(
            { name: listName },
            { $addToSet: { items: itemId } }
        );
    }

    /**
     * Find a list by its name.
     *
     * @param listId
     * @returns {Promise<*>}
     */
    async getListByName(listName) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('lists').findOne( { name: listName } );
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
    async deleteList(listName) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('lists').deleteOne( { name: listName } );
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