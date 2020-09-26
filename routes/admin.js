const express = require('express');
const router = express.Router();

const cms = require('./admin/cms');

/**
 * Admin role name in database.
 *
 * @type {string}
 */
const ADMIN_ROLE = 'admin';

/**
 * Is user authorized to access admin?
 * @param req
 * @param res
 * @returns {boolean}
 */
function isAuthorized(req, res) {
    return res.locals.userState.isRegistered && req.user.role === ADMIN_ROLE;
}

router.get('/', (req, res, next) => {
    if (!isAuthorized(req, res)) {
        return next();
    }

    res.render('admin/index', {
        pageTitle: 'Admin',
        adminUrlKey: process.env.ADMIN_URL_KEY
    });
});

router.get('/cms/create', (req, res, next) => {
    if (!isAuthorized(req, res)) {
        return next();
    }

    cms.showCreateOrUpdate(req, res, next);
});

router.get('/cms/edit/:pageId', (req, res, next) => {
    if (!isAuthorized(req, res)) {
        return next();
    }

    cms.showCreateOrUpdate(req, res, next);
});

router.post('/cms/delete/:pageId', (req, res, next) => {
    if (!isAuthorized(req, res)) {
        return next();
    }

    cms.delete(req, res, next);
});

module.exports = router;
