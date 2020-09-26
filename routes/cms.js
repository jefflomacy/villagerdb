const express = require('express');
const router = express.Router();
const cache = require('../db/cache');
const repo = require('../db/entity/cms-pages');
const config = require('../config/common');

/* get page */
router.get('/:pageId', function(req, res, next) {
    // Try cache first
    cache.get(config.CMS_CACHE_KEY_PREFIX + req.params.pageId)
        .then((cachedData) => {
            if (cachedData) {
                // Easy
                res.render('cms/page', JSON.parse(cachedData));
            } else {
                // Pull from repo
                repo.getPageById(req.params.pageId)
                    .then((page) => {
                        if (!page) {
                            const e = new Error('No such page.');
                            e.status = 404;
                            throw e;
                        }

                        // Build new SEO data
                        const pageData = page;
                        pageData.isCMSPage = true;
                        pageData.pageUrl = 'https://villagerdb.com/cms/' + page.pageId;
                        if (pageData.pageImage) {
                            pageData.useLargeImage = true;
                            pageData.pageImage = 'https://villagerdb.com/' + pageData.pageImage;
                        }

                        // Update cache and go
                        cache.set(config.CMS_CACHE_KEY_PREFIX + req.params.pageId, JSON.stringify(pageData),
                            config.CMS_PAGE_TTL)
                            .then(() => {
                                res.render('cms/page', pageData);
                            })
                            .catch(next);
                    })
                    .catch(next);
            }
        })
        .catch(next);
});

module.exports = router;
