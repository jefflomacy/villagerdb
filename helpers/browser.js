const express = require('express');
const config = require('../config/search.js');
const es = require('../db/elasticsearch');

const pageSize = config.searchResultsPageSize;
const allFilters = config.filters;

function hasTextualQuery(queryList) {
    for (let key in queryList) {
        if (allFilters[key] && allFilters[key].isTextSearch) {
            return true;
        }
    }

    return false;
}

/**
 * Whatever this function returns must be met in all queries. If nothing else, it returns a 'match_all' statement,
 * which always evaluates to true.
 *
 * @param appliedFilters
 * @param fixedQueries
 * @returns {{}}
 */
function getSubsetMatchQuery(appliedFilters, fixedQueries) {
    if (Object.keys(fixedQueries).length === 0) {
        return [{
            match_all: {}
        }];
    }

    const matchQueries = [];
    for (let key in fixedQueries) {
        const innerQuery = { bool: { should: [] }};
        for (let value of fixedQueries[key]) {
            innerQuery.bool.should = innerQuery.bool.should.concat(buildQuery(key, value, appliedFilters));
        }
        matchQueries.push(innerQuery);
    }

    return matchQueries;
}

/**
 * Build a query for the (already-validated) key/value pair.
 *
 * @param key
 * @param value
 */
function buildQuery(key, value, appliedFilters) {
    if (allFilters[key].isTextSearch) { // textual search
        return [
            {
                match: {
                    name: {
                        query: value,
                        analyzer: 'vdb_ascii_fold'
                    }
                }
            },
            {
                match: {
                    ngram: {
                        query: value,
                        analyzer: 'vdb_ascii_fold'
                    }
                }
            }
        ]
    } else if (allFilters[key]) { // faceted search (exact match - term)
        const query = {};

        // Is it game dependent? If so, we have to match on '.value' and also match on all relevant games selected
        // (if any)
        if (allFilters[key].gameDependent) {
            query.nested = {};
            query.nested.path = key;
            query.nested.query = {};
            query.nested.query.bool = {};
            query.nested.query.bool.must = [];
            const term = {};
            term[key + '.value'] = {
                value: value
            };
            query.nested.query.bool.must.push({
                term: term
            });

            // Any games to apply?
            if (typeof appliedFilters === 'object' && typeof appliedFilters.game === 'object') {
                const shoulds = [];
                for (let g of appliedFilters.game) {
                    const gameTerm = {};
                    gameTerm[key + '.game'] = {
                        value: g
                    };
                    shoulds.push({
                        term: gameTerm
                    });
                }
                query.nested.query.bool.must.push({
                    bool: {
                        should: shoulds
                    }
                });
            }
        } else {
            // Non-dependent query
            query.term = {};
            query.term[key] = {
                value: value
            };
        }

        return [query];
    }
}

/**
 * For aggregation purposes, we have to match on game for game dependent search spaces.
 *
 * @param appliedFilters
 * @param key name of the key in the root document that is marked gameDependent in search config
 * @returns {{match_all: {}}|{bool: {must: [{bool: {should: []}}]}}}
 */
function buildGameInnerFilter(appliedFilters, key) {
    if (typeof appliedFilters === 'object' && typeof appliedFilters.game === 'object') {
        const shoulds = [];
        for (let g of appliedFilters.game) {
            const gameTerm = {};
            gameTerm[key + '.game'] = {
                value: g
            };
            shoulds.push({
                term: gameTerm
            });
        }
        return {
            bool: {
                must: [
                    {
                        bool: {
                            should: shoulds
                        }
                    }
                ]
            }
        };
    } else {
        return {
            match_all: {}
        }
    }
}

/**
 * Builds an ElasticSearch query applying the given queries.
 *
 * @param appliedQueries
 * @param fixedQueries
 * @param appliedFilters
 * @returns {{bool: {must: *}}}
 */
function buildRootElasticSearchQuery(appliedQueries, fixedQueries, appliedFilters) {
    // It must always be part of the subset we care about.
    const finalQuery = {
        bool: {
            must: getSubsetMatchQuery(appliedFilters, fixedQueries)
        }
    };

    // Add all applied queries.
    for (let key in appliedQueries) {
        finalQuery.bool.must.push(appliedQueries[key]);
    }

    return finalQuery;
}

/**
 * Transform URL parameters into applied filters that can be used by the frontend and by the getAppliedQueries function
 * here.
 *
 * @param userQueries userQueries from the URL.
 * @param fixedQueries
 */
function getAppliedFilters(userQueries, fixedQueries) {
    const appliedFilters = {};
    for (let key in userQueries) {
        // Skip anything not set in fixedQueries.
        if (typeof fixedQueries[key] === 'undefined') {
            appliedFilters[key] = userQueries[key];
        }
    }

    return appliedFilters;
}
module.exports.getAppliedFilters = getAppliedFilters;

/**
 * Get match queries for the applied filters. Returns an empty array if there is nothing to
 * send to ElasticSearch.
 *
 * @param appliedFilters
 * @returns {[]}
 */
function getAppliedQueries(appliedFilters) {
    const outerQueries = {};
    for (let key in appliedFilters) {
        outerQueries[key] = [];
        let innerQueries = [];
        for (let value of appliedFilters[key]) {
            innerQueries = innerQueries.concat(buildQuery(key, value, appliedFilters));
        }
        outerQueries[key].push({
            bool: {
                should: innerQueries
            }
        });
    }

    return outerQueries;
}

/**
 * Build aggregations for the given search criteria.
 *
 * @param appliedFilters
 * @param appliedQueries
 * @param searchQuery
 * @param fixedQueries
 * @returns {{all_entries: {global: {}, aggregations: {}}}}
 */
function getAggregations(appliedFilters, appliedQueries, fixedQueries) {
    const result = {
        all_entries: {
            global: {},
            aggregations: {}
        }
    };

    // ElasticSearch requires us to nest these aggregations a level deeper than I would like, but it does work.
    const innerAggs = result.all_entries.aggregations;
    for (let key in allFilters) {
        // Skip the game filter, we will do it differently below.
        if (key === 'game') {
            continue;
        }

        // Has to be aggregable, and not already set in the fixed query.
        if (allFilters[key].canAggregate && typeof fixedQueries[key] === 'undefined') {
            // First, build the root aggregation. We always have this.
            // Easier, just the root aggregation.
            innerAggs[key + '_filter'] = {};
            innerAggs[key + '_filter'].filter = getAggregationFilter(key, appliedQueries, fixedQueries, appliedFilters);
            innerAggs[key + '_filter'].aggregations = {};

            // ... but it's not specific enough. Now we need to sub-aggregate if the key in question is dependnet on
            // game.
            if (allFilters[key].gameDependent) {
                innerAggs[key + '_filter'].aggregations[key + '_nested'] = {};
                const subAgg = innerAggs[key + '_filter'].aggregations[key + '_nested'];
                subAgg.nested = {
                    path: key
                };
                subAgg.aggregations = {};
                subAgg.aggregations[key + '_nested_filter'] = {};
                subAgg.aggregations[key + '_nested_filter'].filter = buildGameInnerFilter(appliedFilters, key);
                subAgg.aggregations[key + '_nested_filter'].aggregations = {};
                subAgg.aggregations[key + '_nested_filter'].aggregations[key + '_values'] = {
                    terms: {
                        field: key + '.value', // need .value because its a sub document of (game, value)
                        size: 50
                    }
                }
            } else {
                // Just term aggregator.
                innerAggs[key + '_filter'].aggregations[key + '_values'] = {
                    terms: {
                        field: key,
                        size: 50
                    }
                }
            }
        }
    }

    // The game filter is more complicated. We have to build one aggregation for each game and apply the
    // game-dependent filters that are already applied to find out what documents match.
    for (let game of Object.keys(allFilters['game'].values)) {
        const forcedGameAppliedFilters = Object.assign(appliedFilters,{
            game: [game]
        });

        result['game_' + game] = {};
        result['game_' + game].filter = getAggregationFilter('game', getAppliedQueries(forcedGameAppliedFilters),
            fixedQueries, forcedGameAppliedFilters);
        result['game_' + game].aggregations = {};
        result['game_' + game].aggregations['game_' + game + '_values'] = {
            terms: {
                field: 'game',
                size: 50
            }
        }
    }

    return result;
}

/**
 * Build a filter for a particular aggregation. The only reason this is different from building the overall root query
 * is we exclude the given key filter from the applied queries sent to buildRootElasticSearchQuery.
 *
 * @param key
 * @param appliedQueries
 * @param fixedQueries
 * @param searchQuery
 * @returns {{bool: {must: *[]}}}
 */
function getAggregationFilter(key, appliedQueries, fixedQueries, appliedFilters) {
    // Get all queries that do *not* match this key.
    const facetQueries = [];
    for (let fKey in appliedQueries) {
        if (key !== fKey) {
            facetQueries.push(appliedQueries[fKey]);
        }
    }

    return buildRootElasticSearchQuery(facetQueries, fixedQueries, appliedFilters);
}

/**
 * Restricts the available filters to entities that won't result in a "no results" response from ElasticSearch, and
 * ones that are actually aggregable.
 *
 * @param appliedFilters
 * @param aggregationsRoot
 */
function buildAvailableFilters(appliedFilters, aggregationsRoot) {
    const availableFilters = {};

    // Game aggregations first.
    availableFilters['game'] = {
        name: allFilters['game'].name,
        values: {}
    };
    const gameValues = {};
    for (let key in allFilters['game'].values) {
        const buckets = aggregationsRoot['game_' + key]['game_' + key + '_values'].buckets;
        if (buckets.length > 0) {
            // Find the count for this game in the buckets.
            for (let b of buckets) {
                if (b.key === key && b.doc_count > 0) {
                    gameValues[key] = {
                        label: allFilters['game'].values[key],
                        count: b.doc_count
                    }
                    break;
                }
            }
        }
    }
    availableFilters['game'].values = gameValues;

    // Sort aggregations so that they maintain their order.
    const aggregations = aggregationsRoot.all_entries;
    const sortedAggregations = Object.keys(aggregations)
        .filter((a) => {
            return !a.startsWith('game_'); // skip game aggregations
        })
        .map((a) => {
            // We need the child here, not the parent.
            const split = a.split('_');
            return split[0];
        })
        .filter((a) => {
            return typeof allFilters[a] !== 'undefined' && allFilters[a].canAggregate;
        })
        .sort((a, b) => {
            return allFilters[a].sort - allFilters[b].sort;
        });

    // Find out what filters we can show as available.
    for (let key of sortedAggregations) {
        let agg = undefined;
        // Where the aggregation lives depends on if it's game-dependent or not.
        if (allFilters[key].gameDependent) {
            agg = aggregations[key + '_filter'][key + '_nested'][key + '_nested_filter'][key + '_values'];
        } else {
            agg = aggregations[key + '_filter'][key + '_values'];
        }

        // Skip entirely empty buckets.
        if (agg.buckets.length > 0) {
            // Only show what the aggregation allows.
            const buckets = agg.buckets;

            // Sort the buckets aplhabetically. If it has a key-value store pre-configured, we'll use that instead of
            // alphabetical.
            if (allFilters[key].values) {
                const valueKeys = Object.keys(allFilters[key].values);
                buckets.sort((a, b) => {
                    const aIndex = valueKeys.indexOf(a.key);
                    const bIndex = valueKeys.indexOf(b.key);
                    if (aIndex < bIndex) {
                        return -1;
                    } else {
                        return 1;
                    }
                })
            } else {
                // Sort the keys on their own
                buckets.sort((a, b) => {
                    if (a.key < b.key) {
                        return -1;
                    } else {
                        return 1;
                    }
                });
            }


            // Build the key-value-count store
            const bucketKeyValue = {};

            // Does it have pre-configured display values we want?
            if (allFilters[key].values) {
                for (let b of buckets) {
                    if (allFilters[key].values[b.key]) {
                        bucketKeyValue[b.key] = {
                            label: allFilters[key].values[b.key],
                            count: b.doc_count
                        }
                    }
                }
            } else {
                // Nope... just use the buckets as-presented.
                for (let b of buckets) {
                    bucketKeyValue[b.key] = {
                        label: b.key,
                        count: b.doc_count
                    };
                }
            }

            // Add it as an available filter, finally.
            availableFilters[key] = {
                name: allFilters[key].name,
                values: bucketKeyValue
            };
        }
    }

    return availableFilters;
}

/**
 * Do pagination math.
 *
 * @param pageNumber
 * @param pageSize
 * @param totalCount
 * @param result
 */
function computePageProperties(pageNumber, pageSize, totalCount, result) {
    // Totals
    result.totalCount = totalCount;
    result.totalPages = Math.ceil(totalCount / pageSize);

    // Clean up page number.
    if (pageNumber < 1) {
        pageNumber = 1;
    } else if (pageNumber > result.totalPages) {
        pageNumber = result.totalPages;
    }

    // Pagination specifics
    result.currentPage = pageNumber;
    result.startIndex = (pageSize * (pageNumber - 1) + 1);
    result.endIndex = (pageSize * pageNumber) > totalCount ? totalCount :
        (pageSize * pageNumber);
}

/**
 * Load villagers on a particular page number with a particular search query.
 *
 * @param pageNumber the already sanity checked page number
 * @param userQueries
 * @param fixedQueries
 * @returns {Promise<void>}
 */
async function browse(pageNumber, userQueries, fixedQueries) {
    const result = {};
    result.appliedFilters = getAppliedFilters(userQueries, fixedQueries);

    // Build ES query for applied filters, if any.
    const appliedQueries = getAppliedQueries(result.appliedFilters);

    // Is it a search? Initialize result and ES body appropriately
    const aggs = getAggregations(result.appliedFilters, appliedQueries, fixedQueries);

    // Now we can build the root query...
    const query = buildRootElasticSearchQuery(appliedQueries, fixedQueries, result.appliedFilters);

    // Build the sort. We only include _score if a textual search field was included.
    const sort = [];
    if (hasTextualQuery(appliedQueries) || hasTextualQuery(fixedQueries)) {
        sort.push({
            _score: {
                order: 'desc'
            }
        });
    }
    sort.push({
        keyword: {
            order: "asc"
        }
    });

    // The ultimate goal is to build this body for the query.
    const body = {
        query: query,
        aggregations: aggs,
        sort: sort
    };

    // Get index name
    const indexName = await config.getElasticSearchIndexName();

    // Count.
    const totalCount = await es.count({
        index: indexName,
        body: {
            query: query
        }
    });

    // Update page information.
    computePageProperties(pageNumber, pageSize, totalCount.count, result);

    result.results = [];
    if (totalCount.count > 0) {
        // Load all on this page.
        const results = await es.search({
            index: indexName,
            from: pageSize * (result.currentPage - 1),
            size: pageSize,
            body: body
        });

        result.availableFilters = buildAvailableFilters(result.appliedFilters, results.aggregations);

        // Load the results.
        for (let h of results.hits.hits) {
            result.results.push({
                id: h._id,
                name: h._source.name,
                url: h._source.url,
                image: h._source.image,
                variations: h._source.variations,
                variationImages: h._source.variationImages
            });
        }
    }

    return result;
}

module.exports.browse = browse;