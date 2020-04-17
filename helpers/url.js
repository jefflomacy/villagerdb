/**
 * Filesystem manager.
 * @type {module:fs}
 */
const fs = require('fs');

/**
 * Path manager.
 * @type {module:path}
 */
const path = require('path');

/**
 * For MD5.
 * @type {module:crypto}
 */
const crypto = require('crypto');

/**
 * Thumbnail
 * @type {string}
 */
const THUMB = 'thumb';

/**
 * Medium-sized image
 * @type {string}
 */
const MEDIUM = 'medium';

/**
 * Original scale image
 * @type {string}
 */
const FULL = 'full';

/**
 * Item
 * @type {string}
 */
const ITEM = 'item';

/**
 * Villager
 * @type {string}
 */
const VILLAGER = 'villager';

/**
 * Length of hash key in filenames.
 * @type {number}
 */
const HASH_LENGTH = 7;

/**
 * A very small collection of cached URLs. Really only intended to hold CSS and JS links to be cached busted before
 * reaching the CDN.
 * @type {{}}
 */
const staticCache = {};

/**
 * The path for an image that can't be found.
 *
 * @param type THUMB, MEDIUM or FULL.
 * @returns {string}
 */
function getImageNotFoundFilename(type) {
    return '/images/image-not-available-' + type + '.svg';
}

/**
 * Insert hash string into the last segment of URL before file extension.
 * @param inputUrl
 * @param hash
 * @returns {string}
 */
function addHashToUrl(inputUrl, hash) {
    const fileParts = inputUrl.split('.');
    const newFileParts = [];
    for (let i = 0; i < fileParts.length - 1; i++) {
        newFileParts.push(fileParts[i]);
    }
    newFileParts.push(hash);
    newFileParts.push(fileParts[fileParts.length - 1]);
    return newFileParts.join('.');
};

/**
 * Thumbnail image type.
 * @type {string}
 */
module.exports.THUMB = THUMB;

/**
 * Medium image type.
 * @type {string}
 */
module.exports.MEDIUM = MEDIUM;

/**
 * Full image type.
 * @type {string}
 */
module.exports.FULL = FULL;

/**
 * Item entity type.
 * @type {string}
 */
module.exports.ITEM = ITEM;

/**
 * Villager entity type.
 * @type {string}
 */
module.exports.VILLAGER = VILLAGER;

/**
 * Return the requested image with ID for entity type and image type. Images are attempted in this order:
 * 1) JPEG
 * 2) PNG
 *
 * @param entityType
 * @param imageType: one of THUMB, MEDIUM or FULL.
 * @param id
 * @param variationId if defined, refer to the variation image
 * @param usePlaceholderImage if true (default), returns a placeholder image instead of undefined if image does not
 * exist on disk.
 * @returns {string}
 */
const getImageUrl = (entityType, imageType, id, variationId = undefined,
                     usePlaceholderImage = true) => {
    if (imageType == THUMB || imageType == MEDIUM || imageType == FULL) {
        let imageId = id;
        if (variationId) {
            imageId += '-vv-' + variationId;
        }
        const pathPrefix = './public/images/' + entityType + 's/' + imageType + '/' + imageId;
        if (fs.existsSync(pathPrefix + '.png')) {
            return '/images/' + entityType + 's/' + imageType + '/' + imageId + '.png';
        } else if (fs.existsSync(pathPrefix + '.jpg')) {
            return '/images/' + entityType + 's/' + imageType + '/' + imageId + '.jpg';
        } else if (fs.existsSync(pathPrefix + '.jpeg')) {
            return '/images/' + entityType + 's/' + imageType + '/' + imageId + '.jpeg';
        }
    }

    // Image not found.
    if (usePlaceholderImage) {
        return getImageNotFoundFilename(imageType);
    }
}
module.exports.getImageUrl = getImageUrl;

/**
 * Return the thumb, medium and full URL of images for an entity.
 *
 * @param entityType
 * @param id
 * @param variationId if defined, refer to the variation image
 * @param usePlaceholderImage if true (default), returns a placeholder image instead of undefined if image does not
 * exist on disk.
 * @returns {{thumb: *, medium: *, full: *}}
 */
module.exports.getEntityImageData = (entityType, id, variationId = undefined,
                                     usePlaceholderImage = true) => {
    return {
        thumb: computeStaticAssetUrl(getImageUrl(entityType, THUMB, id, variationId, usePlaceholderImage)),
        medium: computeStaticAssetUrl(getImageUrl(entityType, MEDIUM, id, variationId, usePlaceholderImage)),
        full: computeStaticAssetUrl(getImageUrl(entityType, FULL, id, variationId, usePlaceholderImage))
    };
};

/**
 * Get the URL for a given entity.
 *
 * @param entityType
 * @param id
 * @returns {string}
 */
module.exports.getEntityUrl = (entityType, id) => {
    return '/' + entityType + '/' + id;
};

/**
 * Compute a static asset URL suitable for CDN use. Computations are not cached.
 * @param inputUrl
 * @returns {string}
 */
const computeStaticAssetUrl = (inputUrl) => {
    if (typeof inputUrl !== 'string') {
        return;
    }

    const filePath = path.join(process.cwd(), 'public', inputUrl);
    if (fs.existsSync(filePath)) {
        const fileStr = fs.readFileSync(filePath, 'utf8');
        const hash = crypto.createHash('md5')
            .update(fileStr, 'utf8')
            .digest('hex')
            .substr(0, HASH_LENGTH);
        return addHashToUrl(inputUrl, hash);
    } else {
        // No such file. Just return as is.
        return inputUrl;
    }
};
module.exports.computeStaticAssetUrl = computeStaticAssetUrl;

/**
 * Get a static asset URL that is hashed for use by the CDN. Results are cached in-memory, so this should really only
 * be used for CSS and JS. Images should be pre-computed and put into their respective Redis or ElasticSearch indexes.
 *
 * @param inputUrl
 * @returns {string}
 */
module.exports.getCacheBustedUrl = (inputUrl) => {
    if (staticCache[inputUrl]) {
        return staticCache[inputUrl];
    }

    staticCache[inputUrl] = computeStaticAssetUrl(inputUrl);
    return staticCache[inputUrl];
};