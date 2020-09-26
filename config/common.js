/**
 * Cache key for cms pages in redis
 *
 * @type {string}
 */
module.exports.CMS_CACHE_KEY_PREFIX = 'cmspage:'

/**
 * Cache pages for this amount of time.
 *
 * @type {number}
 */
module.exports.CMS_PAGE_TTL = 3600; // 1 hour