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
    if (!user) {
        return null;
    }

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
            if (!data) {
                const e = new Error('No such user.');
                e.status = 404;
                throw e;
            } else {
                data.isOwnUser = data.user.id === res.locals.userState.id;
                res.render('user', data);
            }

        }).catch(next);
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

module.exports = router;