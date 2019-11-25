const express = require('express');
const router = express.Router();
const config = require('../config/search.js');

router.get('/', function (req, res, next) {
    // Validate query
    if (typeof req.query.q !== 'string' || req.query.q.length > config.maxQueryLength) {
        const e = new Error('Invalid request.');
        e.status = 400; // Bad Request
        throw e;
    }

    res.app.locals.es.search({
        index: config.elasticSearchIndexName,
        body: {
            suggest: {
                entity: {
                    prefix: req.query.q,
                    completion: {
                        field: 'suggest',
                        size: 10,
                        skip_duplicates: true
                    }
                }
            }
        }
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