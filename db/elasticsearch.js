const elasticsearch = require('elasticsearch');
const es = new elasticsearch.Client({
    host: process.env.ELASTICSEARCH_CONNECT_STRING
});

module.exports = es;