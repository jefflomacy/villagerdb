const pages = require('../../db/entity/cms-pages');
const cache = require('../../db/cache');
const config = require('../../config/common');
const {validationResult, body} = require('express-validator');

/**
 * Shows create/edit form for cms pages.
 *
 * @param req
 * @param res
 * @param next
 */
module.exports.showCreateOrUpdate = (req, res, next) => {
    const data = {};
    data.adminUrlKey = process.env.ADMIN_URL_KEY;
    data.pageTitle = 'CMS Page Add / Edit';
    data.page = {};
    data.page.pageId = req.params.pageId;
    data.errors = req.session.errors;

    // Previous submission data, if present
    if (req.session.pageSubmitData) {
        data.page = req.session.pageSubmitData;
        delete req.session.pageSubmitData;
    }

    // Clear previous errors
    delete req.session.errors;

    if (!req.params.pageId) {
        res.render('admin/cms/edit', data); // for new pages
    } else {
        // For existing pages - make sure it exists first.
        pages.getPageById(req.params.pageId)
            .then((page) => {
                if (page) {
                    // Only fill in if not in session already
                    if (!req.session.pageSubmitData) {
                        data.page = page;
                    }
                    res.render('admin/cms/edit', data);
                } else {
                    // No such page...
                    throw new Error('No such page');
                    e.status = 404;
                    throw e;
                }
            }).catch(next);
    }
};

/**
 * Saves changes to a page.
 * @param req
 * @param res
 * @param next
 */
module.exports.save = (req, res, next) => {
    const pageId = req.params.pageId ? req.params.pageId : req.body['page-id'];
    const isNewPage = typeof req.params.pageId === 'undefined';
    let errors = validationResult(req).array();

    // Check if any errors
    if (errors.length > 0) {
        req.session.errors = errors;
        req.session.pageSubmitData = {};
        req.session.pageSubmitData.pageTitle = req.body['page-title'];
        req.session.pageSubmitData.pageDescription = req.body['page-description'];
        req.session.pageSubmitData.pageImage = req.body['page-image'];
        req.session.pageSubmitData.pageContent = req.body['page-content'];
        if (req.params.pageId) {
            res.redirect(process.env.ADMIN_URL_KEY + '/cms/edit/' + req.params.pageId);
        } else {
            res.redirect(process.env.ADMIN_URL_KEY + '/cms/create');
        }
    } else {
        const pageTitle = req.body['page-title'];
        const pageDescription = req.body['page-description'];
        const pageImage = req.body['page-image'];
        const pageContent = req.body['page-content'];
        if (isNewPage) {
            // It's a new town
            pages.createPage(pageId, pageTitle, pageDescription, pageImage, pageContent)
                .then(() => {
                    res.redirect('/' + process.env.ADMIN_URL_KEY + '/cms/edit/' + pageId);
                })
                .catch(next);
        } else {
            // Existing town
            pages.savePage(pageId, pageTitle, pageDescription, pageImage, pageContent)
                .then(() => {
                    // Clear it from the cache
                    cache.delete(config.CMS_CACHE_KEY_PREFIX + pageId)
                        .then(() => {
                            res.redirect('/' + process.env.ADMIN_URL_KEY + '/cms/edit/' + pageId);
                        })
                        .catch(next);
                })
                .catch(next);
        }
    }
};

/**
 * Delete a cms page.
 *
 * @param req
 * @param res
 * @param next
 */
module.exports.delete = (req, res, next) => {
    pages.deletePageById(req.params.pageId)
        .then(() => {
            res.status(204).send();
        })
        .catch(next);
}