const MongoClient = require('mongodb').MongoClient;
const url = process.env.DB_URI;

let connection = null;

module.exports.connect = () => new Promise((resolve, reject) => {
    MongoClient.connect(url, { useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
        if (err) {
            reject(err);
            return;
        }
        resolve(db);
        connection = db;
    });
});

module.exports.get = () => {
    if(!connection) {
        throw new Error('Call connect first!');
    }

    return connection;
}
