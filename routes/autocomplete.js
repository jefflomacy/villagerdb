const express = require('express');
const router = express.Router();
const config = require('../config/search.js');
const es = require('../db/elasticsearch');

router.get('/', function (req, res, next) {
    // Validate query
    if (typeof req.query.q !== 'string' || req.query.q.length > config.maxQueryLength) {
        const e = new Error('Invalid request.');
        e.status = 400; // Bad Request
        throw e;
    }

    config.getElasticSearchIndexName()
        .then((indexName) => {
            return es.search({
                index: indexName,
                body: {
                    suggest: {
                        entity: {
                            prefix: req.query.q,
                            completion: {
                                field: 'suggest',
                                size: 5,
                                skip_duplicates: true,
                                contexts: {
                                    game: ['nh'] // TODO re-add other games later in life
                                }
                            }
                        }
                    }
                }
            })
        })
        .then((results) => {
            const suggestions = [];
            if (results.suggest && results.suggest.entity) {
                for (let x of results.suggest.entity) {
                    for (let y of x.options) {
                        suggestions.push(y.text);
                    }
                }
            }
            res.send(suggestions);
        })
        .catch(next);
});
module.exports = router;