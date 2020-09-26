const mongo = require('../mongo');

/**
 * Name of collection
 * @type {string}
 */
const ENTITY_COLLECTION_NAME = 'cmspages';

/**
 * CmsPages repository.
 */
class CmsPages {
    /**
     * Build the CmsPages class taking in the MongoDatabase object.
     *
     * @param db
     */
    constructor(db) {
        this.db = db;
    }

    /**
     * Save new page.
     *
     * @param pageId
     * @param pageTitle
     * @param pageDescription
     * @param pageImage
     * @param pageContent
     * @returns {Promise<void>}
     */
    async createPage(pageId, pageTitle, pageDescription, pageImage, pageContent) {
        const villagerDb = await this.db.get();
        await villagerDb.collection(ENTITY_COLLECTION_NAME).insertOne({
            pageId: pageId,
            pageTitle: pageTitle,
            pageDescription: pageDescription,
            pageImage: pageImage,
            pageContent: pageContent
        });
    }

    /**
     * Update page in the database.
     *
     * @param pageId
     * @param pageTitle
     * @param pageDescription
     * @param pageImage
     * @param pageContent
     * @returns {Promise<void>}
     */
    async savePage(pageId, pageTitle, pageDescription, pageImage, pageContent) {
        const villagerDb = await this.db.get();
        await villagerDb.collection(ENTITY_COLLECTION_NAME).updateOne(
            {
                pageId: pageId,
            },
            {
                $set: {
                    pageTitle: pageTitle,
                    pageDescription: pageDescription,
                    pageImage: pageImage,
                    pageContent: pageContent,
                }
            });
    }

    /**
     * Get a page
     * @param pageId
     * @returns {Promise<*>}
     */
    async getPageById(pageId) {
        const villagerDb = await this.db.get();
        return villagerDb.collection(ENTITY_COLLECTION_NAME)
            .findOne({
                pageId: pageId,
            });
    }

    /**
     * Delete page from database.
     *
     * @param pageId
     * @returns {Promise<void>}
     */
    async deletePageById(pageId) {
        const villagerDb = await this.db.get();
        await villagerDb.collection(ENTITY_COLLECTION_NAME)
            .deleteOne({
                pageId: pageId,
            });
    }

    /**
     * Get all pages in the database.
     *
     * @returns {Promise<*>}
     */
    async getPages() {
        const villagerDb = await this.db.get();
        return villagerDb.collection(ENTITY_COLLECTION_NAME)
            .find({}).toArray();
    }
}

module.exports = new CmsPages(mongo);