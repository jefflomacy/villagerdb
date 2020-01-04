const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');

/**
 * Load user profile.
 *
 * @param userName
 * @returns {Promise<{}>}
 */
async function loadUser(userName) {
    const result = {};
    const user = await users.findUserByName(userName);
    const userLists = lists.getListsByUser(user.googleId);

    result.pageTitle = user.displayName + "'s Profile";
    result.userName = user.displayName;
    result.lists = userLists;

    return result;
}

/**
 * Load a list.
 *
 * @param userName
 * @param listName
 * @returns {Promise<void>}
 */
async function loadList(userName, listName) {
    const result = {};
    const list = await lists.getListByName(listName);
    console.log(list);
    result.pageTitle = list.name;
    result.listName = list.name;
    result.author = userName;
    result.items = list.items;

    return result;
}

/**
 * Route for user.
 */
router.get('/:userName', function (req, res, next) {
    loadUser(req.params.userName)
        .then((data) => {
            res.render('user', data);
        }).catch(next);
});

router.get('/:userName/list/:listName', (req, res, next) => {
    loadList(req.params.userName, req.params.listName)
        .then((data) => {
            res.render('list', data);
        }).catch(next);
});

module.exports = router;