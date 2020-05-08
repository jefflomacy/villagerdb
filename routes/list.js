const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const {validationResult, body} = require('express-validator');
const format = require('../helpers/format');

/**
 * Minimum name length for a list.
 *
 * @type {number}
 */
const minListNameLength = 3;

/**
 * Maximum name length for a list.
 *
 * @type {number}
 */
const maxListNameLength = 25;

/**
 * Validation expression for a list name.
 *
 * @type {RegExp}
 */
const listRegex = /^[A-Za-z0-9][A-Za-z0-9 ]+$/i;

/**
 * List validation rules on name submission.
 *
 * @type {ValidationChain[]}
 */
const listValidation = [
    body(
        'list-name',
        'List names must be between ' + minListNameLength + ' and ' + maxListNameLength + ' characters long.')
        .isLength({min: minListNameLength, max: maxListNameLength}),
    body(
        'list-name',
        'List names can only have letters, numbers, and spaces, and must start with a letter or number.')
        .matches(listRegex),
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
];

/**
 * Method to query database for user lists.
 *
 * @param listId
 * @returns {Promise<[]>}
 */
async function getUserListsForEntity(listId, entityType, entityId, variationId) {
    const userLists = await lists.getListsByUser(listId);

    if (userLists) {
        userLists.sort(format.listSortComparator); // put in alphabetical order
        let result = [];
        userLists.forEach(function (list) {
            let hasEntity = false;
            for (let item of list.entities) {
                // We want to catch null versus undefined on variationId... so loosely equal on variationId...
                if (item.id === entityId && item.type === entityType && item.variationId == variationId) {
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
 * Generic handler for /user/:entityType/:entityId[/:variationId]
 *
 * @param req
 * @param res
 * @param next
 */
function handleUserListsForEntity(req, res, next) {
    if (res.locals.userState.isRegistered && typeof req.params.entityId === 'string') {
        getUserListsForEntity(req.user.id, req.params.entityType, req.params.entityId, req.params.variationId)
            .then((data) => {
                res.send(data);
            }).catch(next);
    } else {
        res.send([]); // send empty list since there are no lists for non-logged-in users.
    }
}

/**
 * Generic handler for /delete-entity/:listId/:type/:id[/:variationId]
 *
 * @param req
 * @param res
 * @param next
 */
function handleDeleteEntity(req, res, next) {
    if (res.locals.userState.isRegistered) {
        lists.removeEntityFromList(req.user.id,  req.params.listId, req.params.id, req.params.type,
            req.params.variationId)
            .then((dbResponse) => {
                res.status(204).send(); // success reply but empty
            })
            .catch(next);
    } else {
        res.status(403).send();
    }
}

/**
 * Route for getting the create-list page.
 */
router.get('/create', (req, res, next) => {
    const data = {};
    data.pageTitle = 'Create New List';
    data.errors = req.session.errors;
    data.listNameLength = maxListNameLength;
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
router.post('/create', listValidation, (req, res) => {
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
 * Route for getting the rename-list page.
 */
router.get('/rename/:listId', (req, res, next) => {
    const data = {}
    data.pageTitle = 'Rename List';
    data.listId = req.params.listId;
    data.errors = req.session.errors;
    data.listNameLength = maxListNameLength;
    delete req.session.errors;

    if (res.locals.userState.isRegistered) {
        // Make sure the list exists.
        lists.getListById(req.user.username, req.params.listId)
            .then((list) => {
                if (list) {
                    data.listName = list.name;
                    res.render('rename-list', data);
                } else {
                    // No such list...
                    res.redirect('/user/' + req.user.username);
                }
            }).catch(next);
    } else {
        res.redirect('/login'); // create an account to continue
    }
})

/**
 * Route for POSTing new name of a list.
 */
router.post('/rename/:listId', listValidation, (req, res, next) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.status(403).send();
        return;
    }

    const listId = req.params.listId
    const newListName = req.body['list-name'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        res.redirect('/list/rename/' + listId);
    } else {
        lists.renameList(req.user.id, listId, format.getSlug(newListName), newListName)
            .then(() => {
                res.redirect('/user/' + req.user.username + '/list/' + format.getSlug(newListName));
            })
            .catch(next);
    }
});

/**
 * Route for deleting an entity from a list.
 */
router.post('/delete-entity/:listId/:type/:id', (req, res, next) => {
    handleDeleteEntity(req, res, next);
});
router.post('/delete-entity/:listId/:type/:id/:variationId', (req, res, next) => {
    handleDeleteEntity(req, res, next);
});

/**
 * Route for deleting a list.
 */
router.post('/delete/:listId', (req, res) => {
    if (res.locals.userState.isRegistered) {
        lists.deleteList(req.user.id, req.params.listId)
            .then(() => {
                res.status(204).send();
            });
    } else {
        res.status(403).send();
    }
});

/**
 * Route for getting user list for a particular entity type and ID.
 */
router.get('/user/:entityType/:entityId', function (req, res, next) {
    handleUserListsForEntity(req, res, next);
});
router.get('/user/:entityType/:entityId/:variationId', function (req, res, next) {
    handleUserListsForEntity(req, res, next);
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