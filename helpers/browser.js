const express = require('express');
const config = require('../config/search.js');

const pageSize = config.searchResultsPageSize;
const allFilters = config.filters;

/**
 * Whatever this function returns must be met in all queries. If nothing else, it returns a 'match_all' statement,
 * which always evaluates to true.
 *
 * @returns {{}}
 */
function getSubsetMatchQuery() {
    return {
        match_all: {}
    };
}

/**
 * Builds the ElasticSearch query for textual searches.
 *
 * @param searchString
 * @returns {*[]}
 */
function getTextSearchQuery(searchString) {
    return [
        {
            match: {
                name: {
                    query: searchString
                }
            }
        },
        {
            match: {
                phrase: {
                    query: searchString,
                    fuzziness: 'auto'
                }
            }
        }
    ]
}

/**
 * Build a query for the (already-validated) key/value pair.
 *
 * @param key
 * @param value
 */
function buildQuery(key, value) {
    if (key === config.textQuerySearchKey) { // textual search
        return getTextSearchQuery(value);
    } else if (allFilters[key].term) { // faceted search (exact match - term)
        const query = {};
        query.term = {};
        query.term[key] = {
            value: value
        };
        return [query];
    } else { // faceted search (analyzed match)
        const query = {};
        query.match = {};
        query.match[key] = {
            query: value
        };
        return [query];
    }
}

/**
 * Builds an ElasticSearch query applying the given queries.
 *
 * @param appliedQueries
 * @returns {{bool: {must: []}}}
 */
function buildRootElasticSearchQuery(appliedQueries) {
    // It must always be part of the subset we care about.
    const finalQuery = {
        bool: {
            must: [getSubsetMatchQuery()]
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
 * @param params params from the URL.
 */
function getAppliedFilters(params) {
    const appliedFilters = {};
    for (let key in params) {
        // Is it a valid filter?
        if (allFilters[key] && typeof params[key] === 'string' && params[key].length > 0) {
            // Does it have values? Make sure no value exceeds the max query length allowance, and trim them.
            const values = params[key].split(',');
            const setValues = [];
            for (let value of values) {
                if (value.length > config.maxQueryLength) {
                    let e = new Error('Invalid request.');
                    e.status = 400;
                    throw e;
                }
                setValues.push(value.trim());
            }
            if (values.length > 0) {
                // Set them.
                appliedFilters[key] = setValues;
            }
        }
    }

    return appliedFilters;
}

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
        const innerQueries = [];
        for (let value of appliedFilters[key]) {
            const builtQueries = buildQuery(key, value);
            for (let q of builtQueries) {
                innerQueries.push(q);
            }
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
 * @returns {{all_entries: {global: {}, aggregations: {}}}}
 */
function getAggregations(appliedFilters, appliedQueries) {
    const result = {
        all_entries: {
            global: {},
            aggregations: {}
        }
    };

    // ElasticSearch requires us to nest these aggregations a level deeper than I would like, but it does work.
    const innerAggs = result.all_entries.aggregations;
    for (let key in allFilters) {
        if (allFilters[key].canAggregate) {
            innerAggs[key + '_filter'] = {};
            innerAggs[key + '_filter'].filter = getAggregationFilter(appliedQueries, key);
            innerAggs[key + '_filter'].aggregations = {};
            innerAggs[key + '_filter'].aggregations[key] = {
                terms: {
                    field: key,
                    size: 50
                }
            }
        }
    }

    return result;
}

/**
 * Build a filter for a particular aggregation. The only reason this is different from building the overall root query
 * is we exclude the given key filter from the applied queries sent to buildRootElasticSearchQuery.
 *
 * @param appliedQueries
 * @param key
 * @param searchQuery
 * @returns {{bool: {must: *[]}}}
 */
function getAggregationFilter(appliedQueries, key) {
    // Get all queries that do *not* match this key.
    const facetQueries = [];
    for (let fKey in appliedQueries) {
        if (key !== fKey) {
            facetQueries.push(appliedQueries[fKey]);
        }
    }

    return buildRootElasticSearchQuery(facetQueries);
}

/**
 * Restricts the available filters to entities that won't result in a "no results" response from ElasticSearch, and
 * ones that are actually aggregable.
 *
 * @param appliedFilters
 * @param aggregations
 */
function buildAvailableFilters(appliedFilters, aggregations) {
    const availableFilters = {};

    // Sort aggregations so that they maintain their order.
    const sortedAggregations = Object.keys(aggregations)
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
        const agg = aggregations[key + '_filter'][key];
        // Skip entirely empty buckets.
        if (agg.buckets.length > 0) {
            // Only show what the aggregation allows.
            const buckets = agg.buckets
                .map((b) => {
                    return b.key;
                });

            const bucketKeyValue = {};
            if (allFilters[key].values) {
                for (let b of Object.keys(allFilters[key].values)) {
                    if (buckets.includes(b)) {
                        bucketKeyValue[b] = allFilters[key].values[b];
                    }
                }
            } else {
                buckets.sort();
                for (let b of buckets) {
                    bucketKeyValue[b] = b;
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
 * @param es
 * @param pageNumber the already sanity checked page number
 * @param userSearchQueries
 * @returns {Promise<void>}
 */
async function browse(es, pageNumber, userSearchQueries) {
    const result = {};
    result.appliedFilters = getAppliedFilters(userSearchQueries);

    // Build ES query for applied filters, if any.
    const appliedQueries = getAppliedQueries(result.appliedFilters);

    // Is it a search? Initialize result and ES body appropriately
    const aggs = getAggregations(result.appliedFilters, appliedQueries);

    let body;
    const query = buildRootElasticSearchQuery(appliedQueries);

    // The ultimate goal is to build this body for the query.
    body = {
        sort: [
            "_score",
            {
                keyword: "asc"
            }
        ],
        query: query,
        aggregations: aggs
    };

    // Count.
    const totalCount = await es.count({
        index: config.elasticSearchIndexName,
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
            index: config.elasticSearchIndexName,
            from: pageSize * (result.currentPage - 1),
            size: pageSize,
            body: body
        });

        result.availableFilters = buildAvailableFilters(result.appliedFilters, results.aggregations.all_entries);

        // Load the results.
        for (let h of results.hits.hits) {
            result.results.push({
                id: h._id,
                name: h._source.name,
                url: h._source.url,
                imageUrl: h._source.imageUrl
            });
        }
    }

    return result;
}

module.exports = browse;