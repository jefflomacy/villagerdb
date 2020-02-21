const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const users = require('../db/entity/users');

/**
 * Method to query database for user lists.
 *
 * @param id
 * @returns {Promise<[]>}
 */
async function getUserLists(id) {
    let results = [];
    const loggedIn = { loggedIn: true };
    results.push(loggedIn);

    const userLists = await lists.getListsByUser(id)

    let listNames = [];
    userLists.forEach(function (list) {
        listNames.push({name: list.name, id: list.id, entities: list.entities});
    });

    results.push(listNames);

    return results;
}

/**
 * Route for getting user lists.
 */
router.get('/get-user-lists', function (req, res, next) {
    if (res.locals.userState.isRegistered) {
        getUserLists(req.user.id)
            .then((data) => {
                res.contentType('application/json');
                res.send(JSON.stringify(data));
            }).catch(next);
    } else {
        let data = [];
        const loggedIn = false;
        data.push(loggedIn);
        res.send(data);
    }
});

/**
 * Route for adding an item to a list.
 */
router.post('/add-entity-to-list', function (req, res, next) {
    const listId = req.body.listId;
    const entityId = req.body.entityId;
    const type = req.body.type;
    const add = req.body.add;

    if (res.locals.userState.isRegistered) {
        if (add) {
            lists.addEntityToList(req.user.id, listId, entityId, type)
                .then((dbResponse) => {
                    res.status(201).send();
                })
                .catch(next);
        } else {
            lists.removeEntityFromList(req.user.id, listId, entityId, type)
                .then((dbResponse) => {
                    res.status(201).send();
                })
                .catch(next);
        }
    } else {
        res.status(403).send();
    }
});

module.exports = router;