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
    const userLists = await lists.getListsByUser(user.googleId);

    result.user = user;
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
            if (data.user.googleId === res.locals.userState.googleId) {
                data.isOwnUser = true;
            }
            res.render('user', data);
        }).catch(next);
});

/**
 * Route for list.
 */
router.get('/:userName/list/:listName', (req, res, next) => {
    loadList(req.params.userName, req.params.listName)
        .then((data) => {
            res.render('list', data);
        }).catch(next);
});

/**
 * Route for deleting a list.
 */
router.get('/:userName/list/:listName/delete', (req, res) => {
    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.displayName === req.params.userName) {
                    lists.deleteList(req.params.listName)
                        .then(() => {
                            console.log('List', req.params.listName, 'deleted.');
                            res.redirect('/user/' + req.params.userName);
                        })
                } else {
                    res.redirect('/');
                }
            });
    } else {
        res.redirect('/');
    }
});

module.exports = router;