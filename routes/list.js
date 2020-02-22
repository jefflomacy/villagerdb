const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const {validationResult, body} = require('express-validator');
const format = require('../helpers/format');

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
 * Route for getting the create-list page.
 */
router.get('/create', (req, res, next) => {
    const data = {};
    data.pageTitle = 'Create New List';
    data.errors = req.session.errors;
    delete req.session.errors;

    if (res.locals.userState.isRegistered) {
        res.render('create-list', data);
    } else {
        res.redirect('/')
    }
});

/**
 * Route for POSTing new list to the database.
 */
router.post('/create', [
    body(
        'list-name',
        'List names must be between 3 and 25 characters long.')
        .isLength({min: 3, max: 25}),
    body(
        'list-name',
        'List names can only have letters, numbers, and spaces.')
        .matches(/^[A-Za-z0-9]+$/i),
    body(
        'list-name',
        'You already have a list by that name. Please choose another name.')
        .custom((value, {req}) => {
            return lists.listAlreadyExists(req.user.id, format.getSlug(value))
                .then((listExists) => {
                    if (listExists) {
                        return Promise.reject();
                    }
                });
        })
], (req, res) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.redirect('/');
        return;
    }

    const listName = req.body['list-name'];
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        res.redirect('/list/create');
    } else {
        lists.createList(req.user.id, format.getSlug(listName), listName)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            })
    }
});

/**
 * Route for deleting an entity from a list.
 */
router.get('/delete-entity/:listId/:type/:id', (req, res, next) => {
    const listId = req.params.listId;
    const type = req.params.type;
    const entityId = req.params.id;
    if (res.locals.userState.isRegistered) {
        lists.removeEntityFromList(req.user.id, listId, entityId, type)
            .then((dbResponse) => {
                res.redirect('/user/' + req.user.username + '/list/' + listId);
            })
            .catch(next)
    } else {
        res.redirect('/');
    }
});

/**
 * Route for deleting a list.
 */
router.get('/delete/:listId', (req, res) => {
    if (res.locals.userState.isRegistered) {
        lists.deleteList(req.user.id, req.params.listId)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            });
    } else {
        res.redirect('/');
    }
});

/**
 * Route for getting user lists.
 */
router.get('/user-lists', function (req, res, next) {
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
router.post('/entity-to-list', function (req, res, next) {
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