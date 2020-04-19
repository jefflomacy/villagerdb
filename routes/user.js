const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');
const villagers = require('../db/entity/villagers');
const items = require('../db/entity/items');
const format = require('../helpers/format');

/**
 * Load user profile.
 *
 * @param username
 * @returns {Promise<{}>}
 */
async function loadUser(username) {
    const user = await users.findUserByName(username);
    if (!user || typeof user.lists !== 'object') {
        return null;
    }

    // Sort lists alphabetically
    user.lists.sort(format.listSortComparator);

    // Build result out.
    const result = {};
    result.user = user;
    result.pageTitle = user.username + "'s Profile";
    result.username = user.username;
    result.lists = user.lists;
    result.hasLists = user.lists.length > 0;
    result.shareUrl = 'https://villagerdb.com/user/' + user.username;
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
    if (list == null || typeof list.entities !== 'object') {
        return null;
    }

    result.pageTitle = list.name + ' by ' + username;
    result.listId = list.id;
    result.listName = list.name;
    result.author = username;

    // Gather up IDs to grab from redis.
    const villagerIds = [];
    const itemIds = [];
    for (const entity of list.entities) {
        if (entity.type === 'villager') {
            villagerIds.push(entity.id);
        } else if (entity.type === 'item') {
            itemIds.push(entity.id);
        }
    }

    const redisVillagers = await villagers.getByIds(villagerIds);
    const redisItems = await items.getByIds(itemIds);

    // Now build out the entity merged list.
    const entities = [];
    for (const entity of list.entities) {
        if (entity.type === 'villager') {
            if (redisVillagers[entity.id]) {
                entities.push(organizeData(list.id, redisVillagers[entity.id], 'villager'));
            }
        } else {
            if (redisItems[entity.id]) {
                entities.push(organizeData(list.id, redisItems[entity.id], 'item', entity.variationId));
            }
        }
    }

    // Sort list alphabetically
    entities.sort((a, b) => {
        if (a._sortKey < b._sortKey) {
            return -1;
        } else {
            return 1;
        }
    });
    
    result.isEmpty = entities.length === 0;
    result.countText = entities.length + ' item';
    if (entities.length === 0 || entities.length > 1) {
        result.countText += 's';
    }
    result.displayUnit2 = entities.length >= 10;
    result.entities = entities;
    result.shareUrl = 'https://villagerdb.com/user/' + username + '/list/' + list.id;
    return result;
}

/**
 * Clean up data for use by the frontend.
 *
 * @param listId
 * @param entity
 * @param type
 * @param variationId
 * @returns {{}}
 */
function organizeData(listId, entity, type, variationId) {
    let entityData = {};
    entityData.name = entity.name;
    entityData.id = entity.id;
    entityData.type = type;
    entityData.image = entity.image.thumb;
    entityData.deleteUrl = '/list/delete-entity/' + listId + '/' + type + '/' + entity.id;
    entityData._sortKey = entity.id;

    // Variation?
    if (variationId) {
        // Fallback, worst case scenario: display the raw variationId slug
        let variationDisplay = variationId;
        // ... but let's see if we can do better?
        if (typeof entity.variations !== 'undefined' &&
            typeof entity.variations[variationId] !== 'undefined') {
            variationDisplay = entity.variations[variationId];
        }
        entityData.variation = '(' + variationDisplay + ')';
        entityData.deleteUrl += '/' + variationId;
        entityData._sortKey += '-vv-' + variationId;

        // Use variation image if available.
        if (typeof entity.variationImages !== 'undefined' &&
            typeof entity.variationImages[variationId] !== 'undefined' &&
            typeof entity.variationImages[variationId].thumb !== 'undefined') {
            entityData.image = entity.variationImages[variationId].thumb;
        }
    }

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
                data.isOwnUser = res.locals.userState.isRegistered &&
                    req.user.username === req.params.username;
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
                data.isOwnUser = res.locals.userState.isRegistered &&
                    req.user.username === req.params.username;
                res.render('list', data);
            }
        }).catch(next);
});

router.get('/:username_1/list/:listId_1/compare/:username_2/:listId_2', (req, res, next) => {
    loadList(req.params.username_1, req.params.listId_1)
        .then((data_1) => {
            if (!data_1) {
                const e = new Error('No such list.');
                e.status = 404;
                throw e;
            } else {
                loadList(req.params.username_2, req.params.listId_2)
                    .then((data_2) => {
                        if (!data_2) {
                            const e = new Error('No such list.');
                            e.status = 404;
                            throw e;
                        } else {
                            response = {};
                            response.author1 = req.params.username_1;
                            response.author2 = req.params.username_2;
                            response.listName1 = data_1.listName;
                            response.listName2 = data_2.listName;

                            const list_shared = [];
                            const list_u1 = [];
                            const list_u2 = [];
                            const l2_ids = data_2.entities.map(e => e.id);
                            const ids_to_skip = [];

                            data_1.entities.forEach(element => {
                                if (l2_ids.includes(element.id)) {
                                    list_shared.push(element);
                                    ids_to_skip.push(element.id);
                                } else {
                                    list_u1.push(element);
                                }
                            });

                            data_2.entities.filter(e => !ids_to_skip.includes(e.id))
                                .forEach(element => {
                                    list_u2.push(element)
                                });

                            response.entities_shared = list_shared;
                            response.entities_user1 = list_u1;
                            response.entities_user2 = list_u2;

                            res.render('list-compare', response);
                        }
                    }).catch(next);
            }
        }).catch(next);
});

module.exports = router;