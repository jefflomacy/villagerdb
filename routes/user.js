const express = require('express');
const router = express.Router();
const users = require('../db/entity/users');
const lists = require('../db/entity/lists');
const { check, validationResult, body } = require('express-validator');

/**
 * Load user profile.
 *
 * @param username
 * @returns {Promise<{}>}
 */
async function loadUser(username) {
    const result = {};
    const user = await users.findUserByName(username);
    const userLists = user.lists;

    result.user = user;
    result.pageTitle = user.username + "'s Profile";
    result.username = user.username;
    result.lists = userLists;

    return result;
}

/**
 * Load a list.
 *
 * @param username
 * @param listId
 * @returns {Promise<void>}
 */
async function loadList(googleId, username, listId) {
    const result = {};
    const list = await lists.getListById(googleId, listId);

    if (list == null) {
        result.author = username;
        result.errorMessage = true;
        return result;
    }

    result.pageTitle = list.name;
    result.listName = list.name;
    result.author = username;
    result.items = list.items;

    return result;
}

/**
 * Route for user.
 */
router.get('/:username', function (req, res, next) {
    loadUser(req.params.username)
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
router.get('/:username/create-list', (req, res) => {

    const data = {};
    data.errors = req.session.errors;
    delete req.session.errors;

    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.username === req.params.username) {
                    data.user = user;
                    res.render('create-list', data);
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
router.post('/:username/create-list-post', [
        check("listName", "Please enter a name for the list."),
        check("listName", "List name must be at least 3 characters long.").isLength( { min: 3 } ),
        check("listName", "List name must be alphanumeric.").matches(/^[a-z0-9 ]+$/i),
        body("listName")
            .custom((value, { req }) => {
                return lists.listAlreadyExists(req.session.passport.user.googleId, value)
                    .then((listExists) => {
                        if (listExists) {
                            return Promise.reject('List name already in use.');
                        }
                    });
            })
    ],
    (req, res) => {

    const listName = req.body.listName;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors;
        res.redirect('/user/' + req.params.username + '/create-list');
    } else {
        lists.createList(res.locals.userState.googleId, listName)
            .then(() => {
                console.log('List', listName, 'created.');
                res.redirect('/user/' + req.params.username);
            })
    }
});

/**
 * Route for list.
 */
router.get('/:username/list/:listId', (req, res, next) => {
    loadList(res.locals.userState.googleId, req.params.username, req.params.listId)
        .then((data) => {
            res.render('list', data);
        }).catch(next);
});

/**
 * Route for deleting a list.
 */
router.get('/:username/list/:listId/delete', (req, res) => {
    if (res.locals.userState.isLoggedIn) {
        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                if (user.username === req.params.username) {
                    lists.deleteList(res.locals.userState.googleId, req.params.listId)
                        .then(() => {
                            console.log('List', req.params.listId, 'deleted.');
                            res.redirect('/user/' + req.params.username);
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