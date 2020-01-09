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
 * @param listId
 * @returns {Promise<void>}
 */
async function loadList(userName, listId) {
    const result = {};
    const list = await lists.getListById(listId);

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
 * Route for getting the create-list page.
 */
router.get('/:userName/create-list', (req, res) => {
    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.displayName === req.params.userName) {
                    res.render('create-list', user);
                } else {
                    res.redirect('/');
                }
            });
    } else {
        res.redirect('/')
    }
});

/**
 * Route for POSTing new list to the database.
 */
router.post('/:userName/create-list-post', (req, res) => {
    const listName = req.body.listName;

    if (listName) {
        lists.createList(res.locals.userState.googleId, listName)
            .then(() => {
                console.log('List', listName, 'created.');
                res.redirect('/user/' + req.params.userName)
            })
    } else {
        res.redirect('/user/' + req.params.userName + '/create-list')
    }
});

/**
 * Route for list.
 */
router.get('/:userName/list/:listId', (req, res, next) => {
    loadList(req.params.userName, req.params.listId)
        .then((data) => {
            res.render('list', data);
        }).catch(next);
});

/**
 * Route for deleting a list.
 */
router.get('/:userName/list/:listId/delete', (req, res) => {
    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.displayName === req.params.userName) {
                    lists.deleteList(req.params.listId)
                        .then(() => {
                            console.log('List', req.params.listId, 'deleted.');
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