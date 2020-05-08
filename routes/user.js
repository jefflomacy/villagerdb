const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');
const villagers = require('../db/entity/villagers');
const items = require('../db/entity/items');
const format = require('../helpers/format');
const consts = require('../helpers/consts');

/**
 * Load user profile.
 *
 * @param username
 * @returns {Promise<{}|null>}
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
 * @param loggedInUser
 * @returns {Promise<{}|null>}
 */
async function loadList(username, listId, loggedInUser) {
    const result = {};
    const list = await lists.getListById(username, listId);
    if (list == null || typeof list.entities !== 'object') {
        return null;
    }

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
    entities.sort(format.listItemSortComparator);
    
    result.isEmpty = entities.length === 0;
    result.countText = entities.length + ' item';
    if (entities.length === 0 || entities.length > 1) {
        result.countText += 's';
    }
    result.displayUnit2 = entities.length >= 10;
    result.entities = entities;
    result.shareUrl = 'https://villagerdb.com/user/' + username + '/list/' + list.id;

    // SEO
    result.pageTitle = list.name + ' by ' + username;
    result.pageDescription = 'View ' + list.name + ', a list by ' + username + ' containing ' + result.countText;

    // Handle logged in users lists for compare button
    if (typeof loggedInUser === 'object' && loggedInUser.id && loggedInUser.username) {
        let loggedInUserLists = await lists.getListsByUser(loggedInUser.id);
        if (loggedInUserLists) {
            loggedInUserLists = loggedInUserLists
                .filter((u) => {
                    if (username === loggedInUser.username) {
                        return u.id !== listId; // only filter out list if its the same logged in user
                    } else {
                        return true; // include all
                    }
                })
                .map((u) => {
                    return {
                        id: u.id,
                        name: u.name
                    };
                });
            loggedInUserLists.sort(format.listSortComparator);
        }
        result.loggedInUserLists = loggedInUserLists;
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
        entityData.variationId = variationId;
        entityData.variation = '(' + variationDisplay + ')';
        entityData.deleteUrl += '/' + variationId;
        entityData._sortKey += '-vv-' + variationId;
        entityData.isDIY = entityData.variationId === consts.isDIY;

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
    loadList(req.params.username, req.params.listId, req.user)
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
router.get('/:username/list/:listId/compare/:compareUsername/:compareListId', (req, res, next) => {
    // You cannot compare against the same lists
    if (req.params.username === req.params.compareUsername &&
            req.params.listId === req.params.compareListId) {
                const e = new Error('You cannot compare the same list against itself.');
                e.status = 400;
                throw e;
            }

    // Load both user lists
    const response = {};
    Promise.all([loadList(req.params.username, req.params.listId),
        loadList(req.params.compareUsername, req.params.compareListId)])
            .then((values) => {
                if (values.includes(null)) {
                    const e = new Error('No such list.');
                    e.status = 404;
                    throw e;
                } else {
                    response.author = values[0].author;
                    response.listId = values[0].listId;
                    response.listName = values[0].listName;
                    response.otherAuthor = values[1].author;
                    response.otherListId = values[1].listId;
                    response.otherListName = values[1].listName;

                    const otherListElementIds = values[1].entities.map(e => e.type + '-' + e._sortKey);
                    const sharedIds = {}; // make it an O(1) hashmap lookup
                    const entities = [];
                    let diffCount = 0;

                    values[0].entities.forEach(element => {
                        if (otherListElementIds.includes(element.type + '-' + element._sortKey)) {
                            // Matching entries
                            element.compareStatus = 'shared';
                            sharedIds[element.type + '-' + element._sortKey] = true;
                        } else {
                            // Initial user only entries
                            element.compareStatus = 'present';
                            diffCount++;
                        }
                        entities.push(element);
                    });

                    // Add remaining items to list
                    values[1].entities.filter(e => !sharedIds[e.type + '-' + e._sortKey])
                        .forEach(element => {
                            element.compareStatus = 'missing';
                            entities.push(element);
                            diffCount++;
                    });

                    // Sort lists alphabetically
                    entities.sort(format.listItemSortComparator);

                    response.allShared = diffCount == 0;
                    response.noneShared = Object.keys(sharedIds).length === 0;
                    response.entities = entities;

                    // SEO
                    response.pageTitle = 'Compare ' + response.listName + ' to ' + response.otherListName;
                    response.pageDescription = 'View a comparison of list ' + response.listName + ' by ' +
                        response.author + ' to list ' + response.otherListName + ' by ' + response.otherAuthor;
                    response.shareUrl = 'https://villagerdb.com/user/' + req.params.username + '/list/'
                        + req.params.listId + '/compare/'
                        + req.params.compareUsername + '/' + req.params.compareListId;
                    res.render('list-compare', response);
                }
            }).catch(next);
});

module.exports = router;