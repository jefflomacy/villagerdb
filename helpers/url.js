/**
 * Filesystem manager.
 */
const fs = require('fs');

/**
 * Staticify.
 */
const staticify = require('../config/staticify');

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
 * The path for an image that can't be found.
 *
 * @param type THUMB, MEDIUM or FULL.
 * @returns {string}
 */
function getImageNotFoundFilename(type) {
    return '/images/image-not-available-' + type + '.svg';
}

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
 * @returns {string}
 */
function getImageUrl(entityType, imageType, id) {
    if (imageType == THUMB || imageType == MEDIUM || imageType == FULL) {
        const pathPrefix = './public/images/' + entityType + 's/' + imageType + '/' + id;
        if (fs.existsSync(pathPrefix + '.jpg')) {
            return '/images/' + entityType + 's/' + imageType + '/' + id + '.jpg';
        } else if (fs.existsSync(pathPrefix + '.jpeg')) {
            return '/images/' + entityType + 's/' + imageType + '/' + id + '.jpeg';
        } else if (fs.existsSync(pathPrefix + '.png')) {
            return '/images/' + entityType + 's/' + imageType + '/' + id + '.png';
        }
    }

    // Image not found.
    return getImageNotFoundFilename(imageType);
}
module.exports.getImageUrl = getImageUrl;

/**
 * Return the thumb, medium and full URL of images for an entity.
 *
 * @param entityType
 * @param id
 * @returns {{thumb: *, medium: *, full: *}}
 */
module.exports.getEntityImageData = (entityType, id) => {
    return {
        thumb: staticify.getVersionedPath(getImageUrl(entityType, THUMB, id)),
        medium: staticify.getVersionedPath(getImageUrl(entityType, MEDIUM, id)),
        full: staticify.getVersionedPath(getImageUrl(entityType, FULL, id))
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