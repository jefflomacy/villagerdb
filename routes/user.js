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
async function loadList(username, listId, loggedInUserId) {
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

    // Handle logged in users lists for compare button
    if (loggedInUserId) {
        const loggedInUserLists = await lists.getListsByUser(loggedInUserId);
        const userLists = [];
        if (loggedInUserLists != null) {
            for (const uList of loggedInUserLists.filter(liul => liul.id != listId)) {
                userLists.push({
                    "name": uList.name,
                    "id": uList.id
                });
            }
        }
        result.loggedInUserLists =  userLists.isEmpty ? null : userLists;
    }

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
    const loggedInUserId = req.user == null ? null : req.user.id;
    loadList(req.params.username, req.params.listId, loggedInUserId)
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

/**
 * Route for comparing registered user lists
 */
router.get('/:username/list/:listId/compare/:compare_username/:compare_listId', (req, res, next) => {
    // You cannot compare against the same lists
    if (req.params.username === req.params.compare_username &&
            req.params.listId === req.params.compare_listId) {
                const e = new Error('Bad request. You cannot compare against the same lists.');
                e.status = 400;
                throw e;
            }

    // Load both user lists
    Promise.all([loadList(req.params.username, req.params.listId),
        loadList(req.params.compare_username, req.params.compare_listId)])
            .then((values) => {
                if (values.includes(null)) {
                    const e = new Error('No such list.');
                    e.status = 404;
                    throw e;
                } else {
                    response = {};
                    response.author = values[0].author;
                    response.otherAuthor = values[1].author;
                    response.listName = values[0].listName;
                    response.otherListName = values[1].listName;

                    const otherListIds = values[1].entities.map(e => e.id);
                    const sharedIds = [];
                    const entities = [];
                    diffCount = 0;

                    values[0].entities.forEach(element => {
                        if (otherListIds.includes(element.id)) {
                            // Matching entries
                            sharedIds.push(element.id);
                        } else {
                            // Initial user only entries
                            element.compareStatus = "present";
                            diffCount++;
                        }
                        entities.push(element);
                    });

                    // Add remaining items to list
                    values[1].entities.filter(e => !sharedIds.includes(e.id))
                        .forEach(element => {
                            element.compareStatus = "missing";
                            entities.push(element);
                            diffCount++;
                    });

                    // Sort lists alphabetically
                    entities.sort((a, b) => a.name < b.name ? -1 : 1);

                    response.allShared = diffCount == 0;
                    response.noneShared = sharedIds.length == 0;
                    response.entities = entities;
                    res.render('list-compare', response);
                }
            }).catch(next);
});

module.exports = router;