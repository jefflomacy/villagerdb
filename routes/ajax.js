const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');

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
        listNames.push({name: list.name, id: list.id});
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
router.post('/add-item-to-list', function (req, res) {
    const listId = req.body.listId;
    const itemId = req.body.itemId;
    lists.addItemToList(listId, itemId)
        .then((dbResponse) => {
            res.status(201).send('Item added to list successfully.');
        })
        .catch((err) => {
            console.log(err);
        })
});

module.exports = router;