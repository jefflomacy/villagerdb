const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');
const villagers = require('../db/entity/villagers');
const items = require('../db/entity/items');
const { check, validationResult, body } = require('express-validator');
const format = require('../helpers/format');

/**
 * Load user profile.
 *
 * @param username
 * @returns {Promise<{}>}
 */
async function loadUser(username) {
    const result = {};
    const user = await users.findUserByName(username);
    const userLists = user.lists;

    result.user = user;
    result.pageTitle = user.username + "'s Profile";
    result.username = user.username;
    result.lists = userLists;

    return result;
}

/**
 * Load a list.
 *
 * @param username
 * @param listId
 * @returns {Promise<void>}
 */
async function loadList(username, listId) {
    const result = {};
    const list = await lists.getListById(username, listId);

    if (list == null) {
        result.author = username;
        result.errorMessage = true;
        return result;
    }

    result.pageTitle = list.name + ' by ' + username;
    result.listId = list.id;
    result.listName = list.name;
    result.author = username;

    let entities = {};
    for (const entity of list.entities) {
        if (entity.type === 'villager') {
            const villager = await villagers.getById(entity.entityId);
            const villagerData = organizeData(villager, 'villager');
            entities[villager.id] = villagerData;
        } else {
            const item = await items.getById(entity.entityId);
            const itemData = organizeData(item, 'item');
            entities[item.id] = itemData;
        }
    }
    result.entities = entities;

    return result;
}

function organizeData(entity, type) {
    let entityData = {};
    entityData.name = entity.name;
    entityData.id = entity.id;
    entityData.type = type;
    entityData.image = entity.image.thumb;
    return entityData;
}

/**
 * Route for user.
 */
router.get('/:username', function (req, res, next) {
    loadUser(req.params.username)
        .then((data) => {
            data.isOwnUser = data.user.id === res.locals.userState.id;
            res.render('user', data);
        }).catch(next);
});

/**
 * Route for getting the create-list page.
 */
router.get('/:username/create-list', (req, res) => {
    const data = {};
    data.pageTitle = 'Create New List';
    data.errors = req.session.errors;
    delete req.session.errors;

    if (res.locals.userState.isRegistered) {
        users.findUserById(req.user.id)
            .then((user) => {
                if (user) {
                    if (user.username === req.params.username) {
                        data.user = user;
                        res.render('create-list', data);
                    } else {
                        res.redirect('/');
                    }
                } else {
                    res.redirect('/');
                }
            });
    } else {
        res.redirect('/')
    }
});

/**
 * Route for POSTing new list to the database.
 */
router.post('/:username/create-list', [
        body(
            'list-name',
            'List names must be between 3 and 25 characters long.')
            .isLength( { min: 3, max: 25 }),
        body(
            'list-name',
            'List names can only have letters, numbers, and spaces.')
            .matches(/^[A-Za-z0-9]+$/i),
        body(
            'list-name',
            'You already have a list by that name. Please choose another name.')
            .custom((value, { req }) => {
                return lists.listAlreadyExists(req.user.id, format.getSlug(value))
                    .then((listExists) => {
                        if (listExists) {
                            return Promise.reject();
                        }
                    });
            })
    ],
    (req, res) => {
    const listName = req.body['list-name'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        res.redirect('/user/' + req.params.username + '/create-list');
    } else {
        lists.createList(req.user.id, format.getSlug(listName), listName)
            .then(() => {
                res.redirect('/user/' + req.params.username);
            })
    }
});

/**
 * Route for list.
 */
router.get('/:username/list/:listId', (req, res, next) => {
    loadList(req.params.username, req.params.listId)
        .then((data) => {
            if (res.locals.userState.isRegistered) {
                if (req.user.username === req.params.username) {
                    data.isOwnUser = true;
                } else {
                    data.isOwnUser = false;
                }
            }

            res.render('list', data);
        }).catch(next);
});

/**
 * Route for deleting an entity from a list.
 */
router.get('/:username/list/:listId/delete-entity/:type/:id', (req, res) => {
    const googleId = res.locals.userState.googleId;
    const listId = req.params.listId;
    const type = req.params.type;
    const entityId = req.params.id;
    if (res.locals.userState.isRegistered) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.username === req.params.username) {
                    lists.removeEntityFromList(googleId, listId, entityId, type)
                        .then((dbResponse) => {
                            res.redirect('/user/' + req.params.username + '/list/' + listId);
                        })
                        .catch((err) => {
                            console.log(err);
                        });
                } else {
                    res.status(403).redirect('/');
                }
            });
    } else {
        res.status(403).redirect('/');
    }
});

/**
 * Route for deleting a list.
 */
router.get('/list/:listId/delete', (req, res) => {
    if (res.locals.userState.isRegistered) {
        lists.deleteList(req.user.id, req.params.listId)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            });
    } else {
        res.redirect('/');
    }
});

module.exports = router;