const express = require('express');
const router = express.Router();
const axios = require('axios');
const {validationResult, body} = require('express-validator');

const lists = require('../../db/entity/lists');
const items = require('../../db/entity/items');
const format = require('../../helpers/format');

/**
 * Minimum name length for a list.
 *
 * @type {number}
 */
const minListNameLength = 3;

/**
 * Maximum name length for a list.
 *
 * @type {number}
 */
const maxListNameLength = 25;

/**
 * Maximum length of a list category.
 *
 * @type {number}
 */
const maxCategoryNameLength = 25;

/**
 * Maximum length of a text string in a list.
 *
 * @type {number}
 */
const listTextMaxLength = 256;

/**
 * Maximum length of a list note.
 *
 * @type {number}
 */
const noteTextMaxLength = 2048;

/**
 * Validation expression for a list name.
 *
 * @type {RegExp}
 */
const listRegex = /^[A-Za-z0-9][A-Za-z0-9 ]+$/i;

/**
 * Validation expression for a category name.
 *
 * @type {RegExp}
 */
const categoryRegex = /^([A-Za-z0-9][A-Za-z0-9 ])*$/i;

/**
 * List validation rules on existing list submission.
 *
 * @type {ValidationChain[]}
 */
const listValidation = [
    body(
        'list-name',
        'List names must be between ' + minListNameLength + ' and ' + maxListNameLength + ' characters long.')
        .trim()
        .isLength({min: minListNameLength, max: maxListNameLength}),
    body(
        'list-name',
        'List names can only have letters, numbers, and spaces, and must start with a letter or number.')
        .trim()
        .matches(listRegex),
    body(
        'category-name',
        'Category names cannot be longer than ' + maxCategoryNameLength + ' characters.')
        .trim()
        .isLength({max: maxCategoryNameLength}),
    body(
        'category-name',
        'Category names can only have letters, numbers, and spaces, and must start with a letter or number.')
        .trim()
        .matches(categoryRegex),
    body(
        'notes',
        'List notes cannot be more than ' + noteTextMaxLength + ' characters long.')
        .trim()
        .isLength({max: noteTextMaxLength}),
    body(
        'list-name',
        'You already have a list by that name. Please choose another name.')
        .trim()
        .custom((value, {req}) => {
            const newListId = format.getSlug(value);
            return lists.getListById(req.user.username, newListId)
                .then((listExists) => {
                    // If it's a new list, we must check this.
                    if (!req.params.listId && listExists) {
                        return Promise.reject();
                    } else if (req.params.listId) {
                        // Slightly more complicated. List is being renamed, but it's only O.K. if the list exists
                        // if the entered list ID matches the requested list ID.
                        if (req.params.listId !== newListId && listExists) {
                            return Promise.reject();
                        }
                    }
                })
                .catch((e) => {
                    // TODO log
                    return Promise.reject();
                });
        })
];

/**
 * Method to query database for user lists.
 *
 * @param listId
 * @returns {Promise<[]>}
 */
async function getUserListsForEntity(username, entityType, entityId, variationId) {
    const userLists = await lists.getListsByUser(username);

    if (userLists) {
        userLists.sort(format.listSortComparator); // put in alphabetical order
        let result = [];
        userLists.forEach(function (list) {
            let hasEntity = false;
            for (let item of list.entities) {
                // We want to catch null versus undefined on variationId... so loosely equal on variationId...
                if (item.id === entityId && item.type === entityType && item.variationId == variationId) {
                    hasEntity = true;
                    break; // no need to keep computing
                }
            }

            result.push({
                id: list.id,
                name: list.name,
                hasEntity: hasEntity
            })
        });

        return result;
    } else {
        return [];
    }
}

/**
 * Logic for handling list importing from CatalogScanner
 *
 * @param req
 * @param listName the desired name of the list by the user
 * @param listId the id given by CatalogScanner
 * @returns {Promise<string>}
 */
async function listImport(req, listName, listId) {
    // Set timeout and make request
    const https = axios.create();
    https.defaults.timeout = 10000; // TODO maybe move to env?
    https.defaults.timeoutErrorMessage = "nook.lol took too long to respond...";

    // use `/raw` endpoint to avoid getting HTML, and `locale=en-us` to translate the response.
    const requestUrl = 'https://nook.lol/' + listId + '/raw?locale=en-us';
    const urlResponse = await https.get(requestUrl);

    // Split up the reply
    const rawEntityList = urlResponse.data.trim().split('\n');
    const importEntityList = [];
    rawEntityList.forEach((entity, index) => {
        importEntityList.push(format.getSlug(entity));
    });

    // Ask Redis to validate the items for us.
    const redisItems = await items.getByIds(importEntityList);

    // Create the new list now with the name the user requested (already validated)
    await lists.createList(req.user.username, format.getSlug(listName), listName);

    // Import the items into the list.
    await lists.importItemsToList(req.user.username, format.getSlug(listName), redisItems);

    // Redirect to the newly created list.
    return '/user/' + req.user.username + '/list/' + format.getSlug(listName);
}

/**
 * Generic handler for /user/:entityType/:entityId[/:variationId]
 *
 * @param req
 * @param res
 * @param next
 */
function handleUserListsForEntity(req, res, next) {
    if (res.locals.userState.isRegistered && typeof req.params.entityId === 'string') {
        getUserListsForEntity(req.user.username, req.params.entityType, req.params.entityId, req.params.variationId)
            .then((data) => {
                res.send(data);
            })
            .catch(next);
    } else {
        res.send([]); // send empty list since there are no lists for non-logged-in users.
    }
}

/**
 * Generic handler for /delete-entity/:listId/:type/:id[/:variationId]
 *
 * @param req
 * @param res
 * @param next
 */
function handleDeleteEntity(req, res, next) {
    if (res.locals.userState.isRegistered) {
        lists.removeEntityFromList(req.user.username,  req.params.listId, req.params.id, req.params.type,
            req.params.variationId)
            .then(() => {
                res.status(204).send(); // success reply but empty
            })
            .catch(next);
    } else {
        res.status(403).send();
    }
}

/**
 * Generic handler for /update-entity/:listId/:type/:id[/:variationId]
 *
 * @param req
 * @param res
 * @param next
 */
function handleUpdateText(req, res, next) {
    if (res.locals.userState.isRegistered) {
        if (typeof req.body['text'] !== 'string' || req.body['text'].length > listTextMaxLength) {
            res.status(400).send(); // impossible request if user is following the law
            return;
        }

        const text = req.body['text'].trim();
        lists.setEntityText(req.user.username,  req.params.listId, req.params.id, req.params.type,
            req.params.variationId, text)
            .then(() => {
                res.status(204).send(); // success reply but empty
            })
            .catch(next);
    } else {
        res.status(403).send();
    }
}

/**
 * Form for adding/editing a list.
 *
 * @param req
 * @param res
 * @param next
 */
function showListEditForm(req, res, next) {
    if (!res.locals.userState.isRegistered) {
        res.redirect('/login'); // create an account to continue
        return;
    }

    const data = {};
    data.pageTitle = req.params.listId ? 'Edit List' : 'Create New List';
    data.username = req.user.username;
    data.listId = req.params.listId;
    data.errors = req.session.errors;
    data.listNameLength = maxListNameLength;
    data.categoryNameLength = maxCategoryNameLength;
    data.notesLength = noteTextMaxLength;

    // Previous submission data?
    let hadSubmitData = false;
    if (req.session.listSubmitData) {
        data.listName = req.session.listSubmitData.listName;
        data.categoryName = req.session.listSubmitData.categoryName;
        data.notes = req.session.listSubmitData.notes;
        hadSubmitData = true;
    }

    // If any prior errors or submissions, clean them up.
    delete req.session.errors;
    delete req.session.listSubmitData;

    if (!req.params.listId) {
        res.render('list/edit', data); // new list
    } else {
        // Make sure the list exists.
        lists.getListById(req.user.username, req.params.listId)
            .then((list) => {
                if (list) {
                    if (!hadSubmitData) {
                        data.listName = list.name;
                        data.categoryName = list.category;
                        data.notes = list.notes;
                    }
                    res.render('list/edit', data);
                } else {
                    // No such list...
                    res.redirect('/user/' + req.user.username);
                }
            }).catch(next);
    }
}

/**
 * Route for getting the create list page.
 */
router.get('/create', (req, res, next) => {
    showListEditForm(req, res, next);
});

/**
 * Route for POSTing new list to the database.
 */
router.post('/create', listValidation, (req, res, next) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.redirect('/');
        return;
    }

    const listName = req.body['list-name'].trim();
    const categoryName = req.body['category-name'].trim();
    const notes = req.body['notes'].trim();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        req.session.listSubmitData = {
            listName: listName,
            categoryName: categoryName,
            notes: notes
        };
        res.redirect('/list/create');
    } else {
        lists.createList(req.user.username, format.getSlug(listName), listName, categoryName, notes)
            .then(() => {
                res.redirect('/user/' + req.user.username);
            })
            .catch(next);
    }
});

/**
 * Route for getting the edit list page.
 */
router.get('/edit/:listId', (req, res, next) => {
    showListEditForm(req, res, next);
})

/**
 * Route for POSTing edit of a list.
 */
router.post('/edit/:listId', listValidation, (req, res, next) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.status(403).send();
        return;
    }

    const listId = req.params.listId;
    const newListName = req.body['list-name'].trim();
    const newListId = format.getSlug(newListName);
    const newCategoryName = req.body['category-name'].trim();
    const newNotes = req.body['notes'].trim();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        req.session.listSubmitData = {
            listName: newListName,
            categoryName: newCategoryName,
            notes: newNotes
        };
        res.redirect('/list/edit/' + listId);
    } else {
        lists.updateList(req.user.username, listId, newListId, newListName, newCategoryName, newNotes)
            .then(() => {
                res.redirect('/user/' + req.user.username + '/list/' + format.getSlug(newListName));
            })
            .catch(next);
    }
});

/**
 * Route for getting the list import page.
 */
router.get('/import', (req, res, next) => {
    const data = {};
    data.pageTitle = 'Import from CatalogScanner';
    data.errors = req.session.errors;
    data.listNameLength = maxListNameLength;
    delete req.session.errors;

    // Render pre-defined url if it behaves known alphabet
    const predefinedUrl = req.query.cs;
    if (predefinedUrl && /^[A-Za-z0-9]+$/.test(predefinedUrl)) {
        data.predefinedUrl = predefinedUrl;
    }

    if (res.locals.userState.isRegistered) {
        res.render('list/import', data);
    } else {
        res.redirect('/login'); // create an account to continue
    }
})

/**
 * Route for POSTing imported list to the database.
 */
router.post('/import',
    listValidation.concat([
        body(
            'list-url',
            'Please make sure your URL is of the form nook.lol/abc, http://nook.lol/xyz, or https://nook.lol/jkl.')
            .trim()
            .matches(/^((http(s?))\:\/\/)?((ehsan|nook)\.lol\/)([A-za-z0-9]+)$/)
    ]),
    (req, res, next) => {
    // Only registered users here.
    if (!res.locals.userState.isRegistered) {
        res.redirect('/');
        return;
    }

    // Build failure redirect URL - may be different if we need append ?cs=
    let failureRedirect = '/list/import';
    const predefinedUrl = req.query.cs;
    if (predefinedUrl && /^[A-Za-z0-9]+$/.test(predefinedUrl)) {
        failureRedirect += '?cs=' + predefinedUrl;
    }

    // Check for errors.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.session.errors = errors.array();
        res.redirect(failureRedirect);
    } else {
        const listName = req.body['list-name'];
        const url = req.body['list-url']

        // Need to get the last part of the URL when split by '/'.
        const splitParts = url.split('/');
        if (splitParts.length > 0) {
            const listId = splitParts[splitParts.length - 1];
            listImport(req, listName, listId)
                .then((redirect) => {
                    res.redirect(redirect);
                })
                .catch(next);
        } else {
            // Bad things... doesn't match up for some reason.
            req.session.errors = ['URL was incorrect. Please paste the URL given by the CatalogScanner bot.']
            res.redirect('/list/import'); // not going to use failureUrl because this just shouldn't happen...
        }
    }
});

/**
 * Route for deleting an entity from a list.
 */
router.post('/delete-entity/:listId/:type/:id', (req, res, next) => {
    handleDeleteEntity(req, res, next);
});
router.post('/delete-entity/:listId/:type/:id/:variationId', (req, res, next) => {
    handleDeleteEntity(req, res, next);
});

/**
 * Route for updating an entity in a list.
 */
router.post('/update-entity/:listId/:type/:id', (req, res, next) => {
    handleUpdateText(req, res, next);
});
router.post('/update-entity/:listId/:type/:id/:variationId', (req, res, next) => {
    handleUpdateText(req, res, next);
});

/**
 * Route for deleting a list.
 */
router.post('/delete/:listId', (req, res, next) => {
    if (res.locals.userState.isRegistered) {
        lists.deleteList(req.user.username, req.params.listId)
            .then(() => {
                res.status(204).send();
            })
            .catch(next);
    } else {
        res.status(403).send();
    }
});

/**
 * Route for getting user list for a particular entity type and ID.
 */
router.get('/user/:entityType/:entityId', function (req, res, next) {
    handleUserListsForEntity(req, res, next);
});
router.get('/user/:entityType/:entityId/:variationId', function (req, res, next) {
    handleUserListsForEntity(req, res, next);
});

/**
 * Route for adding or removing an item on a list.
 */
router.post('/entity-to-list', function (req, res, next) {
    const listId = req.body.listId;
    const entityId = req.body.entityId;
    const variationId = req.body.variationId;
    const type = req.body.type;
    const add = req.body.add;

    if (res.locals.userState.isRegistered) {
        if (add === 'true') { // i hate form data
            lists.addEntityToList(req.user.username, listId, entityId, type, variationId)
                .then(() => {
                    res.status(200).send({success: true});
                })
                .catch(next);
        } else {
            lists.removeEntityFromList(req.user.username, listId, entityId, type, variationId)
                .then(() => {
                    res.status(200).send({success: true});
                })
                .catch(next);
        }
    } else {
        res.status(403).send();
    }
});

module.exports = router;