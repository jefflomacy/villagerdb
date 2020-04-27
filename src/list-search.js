/**
 * Facilitate search of user lists.
 */

/**
 * jQuery
 * @type {*|(function(...[*]=))}
 */
const $ = require('jquery');

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

        // Show/hide depending on match.
        let itemCount = 0;
        $('ul.user-list-view li')
            .each((i, li) => {
                const name = $(li).data('name').toLowerCase();
                console.log(searchQuery + '; ' + name + '; ' + name.indexOf(searchQuery));
                if (typeof name !== 'string' || name.indexOf(searchQuery) === -1) {
                    $(li).attr('style', 'display: none !important;'); // some bad bootstrap practice we have to override
                } else {
                    $(li).attr('style', ''); // show
                    itemCount++;
                }
            });

        // Update count and show notice.
        const resultText = (itemCount === 1) ? 'result' : 'results';
        $('#user-list-size').text(itemCount + ' ' + resultText);
        $('#user-list-search-query').text($('#user-list-search').val());
        $('#user-list-search-notice').show();
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
    // Show all items.
    $('ul.user-list-view li').attr('style', '');

    // Hide notice.
    $('#user-list-search-notice').hide();

    // Put count back.
    $('#user-list-size').text($('#user-list-size').data('orig-text'));
}