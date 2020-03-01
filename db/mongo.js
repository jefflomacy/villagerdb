const MongoClient = require('mongodb').MongoClient;

/**
 * Stateful Mongo database wrapper that connects to the database for us.
 */
class MongoDatabase {
    /**
     *
     * @param uri
     * @param dbName
     * @param dbConfig
     */
    constructor(uri, dbName, dbConfig) {
        /**
         *
         * @type {string}
         */
        this.uri = uri;

        /**
         *
         * @type {string}
         */
        this.dbName = dbName;

        /**
         *
         * @type {{}}
         */
        this.dbConfig = dbConfig;

        /**
         *
         * @type {Db}
         */
        this.database = undefined; // undefined until a successful connection is made.
    }

    /**
     * Retrieves the database, connecting if not already connected.
     *
     * @returns {Db}
     */
    async get() {
        if (!this.database) {
            const connect = await MongoClient.connect(this.uri, this.dbConfig);
            this.database = connect.db(this.dbName);
        }
        return this.database;
    }
}

/**
 * Mongo database container.
 * @type {MongoDatabase}
 */
module.exports = new MongoDatabase(process.env.MONGO_CONNECT_STRING, process.env.MONGO_DB_NAME, {
    useUnifiedTopology: true,
    useNewUrlParser: true
});