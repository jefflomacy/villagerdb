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
        const villagerDb = await this.db.get();
        await villagerDb.collection('users').insertOne({
            googleId: googleId,
            email: email,
            lists: []
        });
        return villagerDb.collection('users')
            .findOne({
                googleId: googleId
            });
    }

    /**
     * Set a user as registered.
     *
     * @param username
     * @param id
     * @returns {Promise<Promise|OrderedBulkOperation|UnorderedBulkOperation>}
     */
    async setRegistered(username, id) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .updateOne({
                _id: id
            },
            {
                $set: {
                    username: username
                }
            });
    }

    /**
     * Find a user by their google id.
     *
     * @param googleId
     * @returns {Promise<*>}
     */
    async findUserByGoogleId(googleId) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .findOne({
                googleId: googleId
            });
    }

    /**
     * Find a user by their id.
     *
     * @param id
     * @returns {Promise<*>}
     */
    async findUserById(id) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .findOne({
                _id: new ObjectId(id)
            });
    }

    /**
     * Find a user by their username.
     *
     * @param username
     * @returns {Promise<*>}
     */
    async findUserByName(username) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .findOne( {
                username: username
            });
    }

    /**
     * Delete a user by their google id.
     *
     * @param id
     * @returns {Promise<*>}
     */
    async deleteUser(id) {
        const villagerDb = await this.db.get();
        return villagerDb.collection('users')
            .deleteOne({
                _id: id
            });
    }

    /**
     * Method for validating if a username is already in use.
     *
     * @param name
     * @returns {Promise<boolean>}
     */
    async usernameAlreadyExists(name) {
        const villagerDb = await this.db.get();
        const user = await villagerDb.collection('users')
            .findOne({
                username: name
            });
        return user !== null;
    }
}

module.exports = new Users(mongo);