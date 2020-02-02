const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const users = require('../db/entity/users');

/**
 * Method to query database for user lists.
 *
 * @param googleId
 * @returns {Promise<[]>}
 */
async function getUserLists(googleId) {
    let results = [];
    const loggedIn = { loggedIn: true };
    results.push(loggedIn);

    const userLists = await lists.getListsByUser(googleId)

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
    if (res.locals.userState.isLoggedIn) {
        getUserLists(res.locals.userState.googleId)
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
router.post('/add-entity-to-list', function (req, res) {
    const googleId = res.locals.userState.googleId;
    const listId = req.body.listId;
    const entityId = req.body.entityId;
    const type = req.body.type;
    const add = req.body.add;

    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.googleId === res.locals.userState.googleId) {
                    if (add === "true") {
                        lists.addEntityToList(googleId, listId, entityId, type)
                            .then((dbResponse) => {
                                res.status(201).send('Item added to list successfully.');
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    } else {
                        lists.removeEntityFromList(googleId, listId, entityId, type)
                            .then((dbResponse) => {
                                res.status(201).send('Item removed from list successfully.');
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    }
                }
            });
    } else {
        res.redirect('/');
    }
});

module.exports = router;