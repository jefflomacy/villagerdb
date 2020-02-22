const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');
const villagers = require('../db/entity/villagers');
const items = require('../db/entity/items');

/**
 * Load user profile.
 *
 * @param username
 * @returns {Promise<{}>}
 */
async function loadUser(username) {
    const user = await users.findUserByName(username);
    if (!user) {
        return null;
    }

    const result = {};
    result.user = user;
    result.pageTitle = user.username + "'s Profile";
    result.username = user.username;
    result.lists = user.lists;
    result.hasLists = user.lists.length > 0;
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
        return null;
    }

    result.pageTitle = list.name + ' by ' + username;
    result.listId = list.id;
    result.listName = list.name;
    result.author = username;

    const entities = [];
    for (const entity of list.entities) {
        if (entity.type === 'villager') {
            // TODO make a singular call to redis
            const villager = await villagers.getById(entity.id);
            if (villager) {
                entities.push(organizeData(villager, 'villager'));
            }
        } else {
            // TODO make a singular call to redis
            const item = await items.getById(entity.id);
            if (item) {
                entities.push(organizeData(item, 'item'));
            }

        }
    }
    result.isEmpty = entities.length === 0;
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
            if (!data) {
                const e = new Error('No such list.');
                e.status = 404;
                throw e;
            } else {
                if (res.locals.userState.isRegistered) {
                    if (req.user.username === req.params.username) {
                        data.isOwnUser = true;
                    } else {
                        data.isOwnUser = false;
                    }
                }

                res.render('list', data);
            }
        }).catch(next);
});

module.exports = router;