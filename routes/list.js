const express = require('express');
const router = express.Router();
const lists = require('../db/entity/lists');
const {validationResult, body} = require('express-validator');
const format = require('../helpers/format');

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

module.exports = router;