const db = require('./mongo');
const ObjectId = require('mongodb').ObjectID;
const dbName = process.env.DB_NAME;

class mongoWrapper {

    async saveUser(googleId, email) {
        let conn = db.get();
        const villagerDb = conn.db(dbName);
        await villagerDb.collection('users').insertOne( { googleId: googleId, email: email } );
        const res = await villagerDb.collection('users').findOne( { googleId: googleId } );
        return res;
    }

    async findUserByGoogleId(googleId) {
        let conn = db.get();
        const villagerDb = conn.db(dbName);
        const res = await villagerDb.collection('users').findOne( { googleId: googleId } );
        return res;
    }

    async findUserById(id) {
        let conn = db.get();
        const villagerDb = conn.db(dbName);
        const res = await villagerDb.collection('users').findOne( { _id: new ObjectId(id) } );
        return res;
    }
}

module.exports = new mongoWrapper();