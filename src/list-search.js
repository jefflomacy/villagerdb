/**
 * Facilitate search of user lists.
 */

/**
 * jQuery
 * @type {*|(function(...[*]=))}
 */
const $ = require('jquery');

/**
 * Contains all the list elements after detachment. They will be re-inserted if they apply.
 *
 * @type {jQuery}
 */
let listElements = undefined;

$(document).ready(() => {
    // Search button click
    $('#user-list-search-submit').on('click', (e) => {
        e.preventDefault();

        // Cleaned search query.
        const searchQuery = $('#user-list-search').val().trim().toLowerCase();
        if (searchQuery.length === 0) {
            removeQuery();
            return;
        }

        // Filter
        filterItems(searchQuery);
    });

    // Clear click.
    $('#user-list-search-clear').on('click', (e) => {
        e.preventDefault();
        removeQuery();
    });
});

/**
 * Display full list again, no more query.
 */
function removeQuery() {
    // Clear query.
    filterItems();

    // Hide notice.
    $('#user-list-search-notice').hide();

    // Empty textbox.
    $('#user-list-search').val('');
}

/**
 * Filter the list. If no query provided, just shows all.
 *
 * @param searchQuery
 * @returns {number}
 */
function filterItems(searchQuery) {
    let itemCount = 0;

    // Did we gather up all the list elements yet? If not, do so.
    if (!listElements) {
        listElements = $('ul.user-list-view li').detach();
    } else {
        // Otherwise, detach all again.
        $('ul.user-list-view li').detach();
    }

    // Loop through and add each back as needed.
    for (let element of listElements) {
        const name = $(element).data('name').toLowerCase();
        // If search query is empty, show all.
        if (typeof searchQuery === 'undefined' || (typeof name === 'string' && name.indexOf(searchQuery) !== -1)) {
            $('ul.user-list-view').append(element);
            itemCount++;
        }
    }

    // Update count and show notice.
    const resultText = (itemCount === 1) ? 'result' : 'results';
    if (searchQuery) {
        // Show result text
        $('#user-list-size').text(itemCount + ' ' + resultText);
    } else {
        // Show original text.
        $('#user-list-size').text($('#user-list-size').data('orig-text'));
    }

    $('#user-list-search-query').text($('#user-list-search').val());
    $('#user-list-search-notice').show();

    // Hide list count if no results, and show notice. Otherwise, opposite.
    if (itemCount > 0) {
        $('#user-list-size').show();
        $('#user-list-search-no-results').hide();
    } else {
        $('#user-list-size').hide();
        $('#user-list-search-no-results').show();
    }
}