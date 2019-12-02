/**
 * Image configuration settings.
 * @type {{}}
 */
const imageConfig = require('../config/images.js');

/**
 * Filesystem manager.
 */
const fs = require('fs');

const THUMB = 'thumb';
const MEDIUM = 'medium';
const FULL = 'full';

/**
 * Thumbnail type.
 * @type {string}
 */
module.exports.THUMB = THUMB;

/**
 * Medium type.
 * @type {string}
 */
module.exports.MEDIUM = MEDIUM;

/**
 * Full type.
 * @type {string}
 */
module.exports.FULL = FULL;

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
module.exports.getImageUrl = (entityType, imageType, id) => {
    if (imageType == THUMB || imageType == MEDIUM || imageType == FULL) {
        const pathPrefix = './public/images/' + entityType + 's/' + imageType + '/' + id;
        if (fs.existsSync(pathPrefix + '.jpg')) {
            return '/images/' + entityType + 's/' + imageType + '/' + id + '.jpg';
        } else if (fs.existsSync(pathPrefix + '.jpeg')) {
            return'/images/' + entityType + 's/' + imageType + '/' + id + '.jpeg';
        } else if (fs.existsSync(pathPrefix + '.png')) {
            return '/images/' + entityType + 's/' + imageType + '/' + id + '.png';
        }
    }

    // Image not found.
    return imageConfig.getImageNotFoundFilename(entityType);
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