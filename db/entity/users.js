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

    async saveUser(googleId, email) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        await villagerDb.collection('users').insertOne( { googleId: googleId, email: email, registered: false } );
        return await villagerDb.collection('users').findOne( { googleId: googleId } );
    }

    async setRegistered(displayName, googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        await villagerDb.collection('users').updateOne(
            { googleId: googleId },
            { $set: {displayName: displayName, registered: true} }
        );
    }

    async findUserByGoogleId(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { googleId: googleId } );
    }

    async findUserById(id) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { _id: new ObjectId(id) } );
    }

    async isRegistered(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').findOne( { googleId: googleId, registered: true });
    }

    async deleteUser(googleId) {
        let conn = this.db.get();
        const villagerDb = conn.db(this.dbName);
        return await villagerDb.collection('users').deleteOne( { googleId: googleId } );
    }

}

module.exports = new Users(mongo, process.env.DB_NAME);