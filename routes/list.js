const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const {validationResult, body} = require('express-validator');
const format = require('../helpers/format');

/**
 * Method to query database for user lists.
 *
 * @param listId
 * @returns {Promise<[]>}
 */
async function getUserListsForEntity(listId, entityType, entityId, variationId) {
    const userLists = await lists.getListsByUser(listId)

    if (userLists) {
        let result = [];
        userLists.forEach(function (list) {
            let hasEntity = false;
            for (let item of list.entities) {
                // TODO central location for this computation
                const split = item.id.split(':');
                const listEntityId = split[0];
                const listVariationId = split.length > 0 ? split[1] : undefined;
                if (listEntityId === entityId && item.type === entityType && listVariationId === variationId) {
                    hasEntity = true;
                }
            }

            result.push({
                id: list.id,
                name: list.name,
                hasEntity: hasEntity
            })
        });

        return result;
    } else {
        return [];
    }
}

/**
 * Route for getting the create-list page.
 */
router.get('/create', (req, res, next) => {
    const data = {};
    data.pageTitle = 'Create New List';
    data.errors = req.session.errors;
    delete req.session.errors;

    if (res.locals.userState.isRegistered) {
        res.render('create-list', data);
    } else {
        res.redirect('/login'); // create an account to continue
    }
});

/**
 * Route for POSTing new list to the database.
 */
router.post('/create', [
    body(
        'list-name',
        'List names must be between 3 and 25 characters long.')
        .isLength({min: 3, max: 25}),
    body(
        'list-name',
        'List names can only have letters, numbers, and spaces, and must start with a letter or number.')
        .matches(/^[A-Za-z0-9][A-Za-z0-9 ]+$/i),
    body(
        'list-name',
        'You already have a list by that name. Please choose another name.')
        .trim()
        .custom((value, {req}) => {
            return lists.getListById(req.user.username, format.getSlug(value))
                .then((listExists) => {
                    if (listExists) {
                        return Promise.reject();
                    }
                });
        })
], (req, res) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.redirect('/');
        return;
    }

    const listName = req.body['list-name'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        res.redirect('/list/create');
    } else {
        lists.createList(req.user.id, format.getSlug(listName), listName)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            })
    }
});

/**
 * Route for deleting an entity from a list.
 */
router.get('/delete-entity/:listId/:type/:id', (req, res, next) => {
    const listId = req.params.listId;
    const type = req.params.type;
    const entityId = req.params.id;
    if (res.locals.userState.isRegistered) {
        lists.removeEntityFromList(req.user.id, listId, entityId, type)
            .then((dbResponse) => {
                res.redirect('/user/' + req.user.username + '/list/' + listId);
            })
            .catch(next)
    } else {
        res.redirect('/');
    }
});

/**
 * Route for deleting a list.
 */
router.get('/delete/:listId', (req, res) => {
    if (res.locals.userState.isRegistered) {
        lists.deleteList(req.user.id, req.params.listId)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            });
    } else {
        res.redirect('/');
    }
});

/**
 * Route for getting user list for a particular entity type and ID.
 */
router.get('/user/:entityType/:entityId', function (req, res, next) {
    if (res.locals.userState.isRegistered && typeof req.params.entityId === 'string') {
        // TODO central location for this computation
        const split = req.params.entityId.split(':');
        const entityId = split[0];
        const variationId = split.length > 0 ? split[1] : undefined;
        getUserListsForEntity(req.user.id, req.params.entityType, entityId, variationId)
            .then((data) => {
                res.send(data);
            }).catch(next);
    } else {
        res.send([]); // send empty list since there are no lists for non-logged-in users.
    }
});

/**
 * Route for adding or removing an item on a list.
 */
router.post('/entity-to-list', function (req, res, next) {
    const listId = req.body.listId;
    const entityId = req.body.entityId;
    const variationId = req.body.variationId;
    const type = req.body.type;
    const add = req.body.add;

    if (res.locals.userState.isRegistered) {
        if (add === 'true') { // i hate form data
            lists.addEntityToList(req.user.id, listId, entityId, type, variationId)
                .then((dbResponse) => {
                    res.status(200).send({success: true});
                })
                .catch(next);
        } else {
            lists.removeEntityFromList(req.user.id, listId, entityId, type, variationId)
                .then((dbResponse) => {
                    res.status(200).send({success: true});
                })
                .catch(next);
        }
    } else {
        res.status(403).send();
    }
});

module.exports = router;