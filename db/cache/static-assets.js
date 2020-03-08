const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const redis = require('./redis');
const AbstractCache = require('./abstract-cache');
const cache = new AbstractCache(redis, 'img');;

/**
 * Length of hash key in filenames.
 * @type {number}
 */
const HASH_LENGTH = 7;

/**
 * Compute a static asset URL suitable for CDN use. Skips the cache (expensive).
 * @param inputUrl
 * @returns {Promise<string|*>}
 */
const computeStaticAssetUrl = (inputUrl) => {
    const filePath = path.join(process.cwd(), 'public', inputUrl);
    if (fs.existsSync(filePath)) {
        const fileStr = fs.readFileSync(filePath, 'utf8');
        const hash = crypto.createHash('md5')
            .update(fileStr, 'utf8')
            .digest('hex')
            .substr(0, HASH_LENGTH);
        const fileParts = inputUrl.split('.');
        const newFileParts = [];
        for (let i = 0; i < fileParts.length - 1; i++) {
            newFileParts.push(fileParts[i]);
        }
        newFileParts.push(hash);
        newFileParts.push(fileParts[fileParts.length - 1]);
        return newFileParts.join('.');
    } else {
        // No such file. Just return as is.
        return inputUrl;
    }
};
module.exports.computeStaticAssetUrl = computeStaticAssetUrl;

/**
 * Get a static asset URL that is hashed for use by the CDN.
 *
 * @param inputUrl
 * @returns {Promise<string|*>}
 */
module.exports.getStaticAssetUrl = async (inputUrl) => {
    // Get it from the cache if we can.
    const cacheValue = await cache.get(inputUrl);
    if (cacheValue) {
        return cacheValue;
    }

    // Cache miss. Compute MD5, cache it, and then return it.
    const finalUrl = computeStaticAssetUrl(inputUrl);
    await cache.set(inputUrl, finalUrl);
    return finalUrl;
};