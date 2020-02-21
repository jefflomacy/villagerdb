const MongoClient = require('mongodb').MongoClient;

/**
 * Stateful Mongo database wrapper that connects to the database for us.
 */
class MongoDatabase {
    /**
     * Builds the database.
     *
     * @param uri the database URI
     * @param dbConfig config to pass to MongoClient
     */
    constructor(uri, dbConfig) {
        this.uri = uri;
        this.dbConfig = dbConfig;
        this.connection = undefined;
        this._connect();
    }

    /**
     * Connects to the database. Called when the class is constructed.
     * @private
     */
    _connect() {
        MongoClient.connect(this.uri, this.dbConfig)
            .then((db) => {
                this.connection = db;
            })
            .catch((error) => {
                console.error('Mongo database connection failed...');
                console.error(error);
            });
    }

    /**
     * Retrieves the database, if connected.
     * @returns {MongoClient}
     */
    get() {
        if (!this.connection) {
            throw new Error('Database is not available yet.');
        }

        return this.connection;
    }
}

/**
 * Mongo database container.
 * @type {MongoDatabase}
 */
module.exports = new MongoDatabase(process.env.MONGO_CONNECT_STRING, {
    useUnifiedTopology: true,
    useNewUrlParser: true});