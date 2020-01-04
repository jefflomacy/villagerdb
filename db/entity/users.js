const mongo = require('../mongo');
const ObjectId = require('mongodb').ObjectID;

/**
 * User repository.
 */
class Users {

    /**
     * Build the Users class taking in the MongoDatabase object and a database name.
     *
     * @param db
     * @param dbName
     */
    constructor(db, dbName) {
        this.db = db;
        this.dbName = dbName;
    }

    /**
     * Save a new user to the database.
     *
     * @param googleId
     * @param email
     * @returns {Promise<*>}
     */
    async saveUser(googleId, email) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        await villagerDb.collection('users').insertOne( { googleId: googleId, email: email, registered: false } );
        return await villagerDb.collection('users').findOne( { googleId: googleId } );
    }

    /**
     * Set a user as registered.
     *
     * @param displayName
     * @param googleId
     * @returns {Promise<void>}
     */
    async setRegistered(displayName, googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        await villagerDb.collection('users').updateOne(
            { googleId: googleId },
            { $set: {displayName: displayName, registered: true} }
        );
    }

    /**
     * Return whether a user is registered or not.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async isRegistered(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { googleId: googleId, registered: true });
    }

    /**
     * Find a user by their google id.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async findUserByGoogleId(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { googleId: googleId } );
    }

    /**
     * Find a user by their id.
     *
     * @param id
     * @returns {Promise<*>}
     */
    async findUserById(id) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { _id: new ObjectId(id) } );
    }

    /**
     * Find a user by their name.
     *
     * @param name
     * @returns {Promise<*>}
     */
    async findUserByName(name) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { displayName: name } );
    }

    /**
     * Delete a user by their google id.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async deleteUser(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').deleteOne( { googleId: googleId } );
    }

}

module.exports = new Users(mongo, process.env.DB_NAME);