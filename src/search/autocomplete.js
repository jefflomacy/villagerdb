import $ from "jquery";
import _ from 'underscore';

/**
 * The currently-executing request. We cancel it if concurrent ones are happening.
 */
let currentRequest;

$(document).ready(() => {
    const dataList = $('#autocomplete-items');

    /**
     * Up/Down arrow support for autocomplete items
     * @param e
     */
    const upDownArrowHandler = (e) => {
        // Up = 38, Down = 40
        if (e.keyCode == 38 || e.keyCode == 40) {
            // Prevent cursor from jumping to the start or end of query in the search box
            e.preventDefault();

            // The "selected" class indicates the currently selected item
            const currentSelected = $('#autocomplete-items li.selected');
            let newSelected;
            // If there is an item currently selected, cycle through the list
            // Otherwise, select the top or bottom one depending on the key pressed
            if (currentSelected.length > 0) {
                currentSelected.removeClass('selected');
                const items = currentSelected.parent().children();
                if (e.keyCode == 38) {
                    newSelected = items.eq((items.index(currentSelected) - 1) % items.length)
                } else if (e.keyCode = 40) {
                    newSelected = items.eq((items.index(currentSelected) + 1) % items.length)
                }
            } else {
                if (e.keyCode == 38) {
                    newSelected = $('#autocomplete-items li').last();
                } else if (e.keyCode = 40) {
                    newSelected = $('#autocomplete-items li').first();
                }
            }
            newSelected.addClass('selected');
            $('#q').val(newSelected.text());
        }
    }

    /**
     * Make the list visible.
     */
    const showList = () => {
        $(window).on('keydown', upDownArrowHandler);
        dataList.show();
    };

    /**
     * Make the list invisible.
     */
    const hideList = () => {
        $(window).off('keydown');
        dataList.hide();
    };

    /**
     * Get the list from the server.
     * @param e
     */
    const fillAutoComplete = (e) => {
        // Hide the list until we have results.
        hideList();

        // Only continue if we have something to search for.
        const q = $(e.target).val().trim();
        if (q.length === 0) {
            return;
        }

        // There is no way to ensure that a race condition won't cause 'currentRequest' to be null one in a million
        // times, so we have to wrap this all in a try-catch block so we don't crash the browser if that ever happens.
        try {
            // Make the request, aborting the existing one if set.
            if (currentRequest) {
                currentRequest.abort();
            }
            currentRequest = $.ajax({
                url: '/autocomplete?q=' + q,
                type: 'GET',
                dataType: 'json',
                success: (suggestions) => {
                    // Empty the list before filling it.
                    dataList.empty();
                    for (let s of suggestions) {
                        const elem = $('<li></li>')
                            .text(s)
                            .on('click', doAutoComplete);
                        dataList.append(elem);
                    }

                    // Show it once filled.
                    showList();
                    currentRequest = undefined;
                },
                error: function() {
                    currentRequest = undefined;
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    /**
     * Fill in the box and submit the form.
     * @param e
     */
    const doAutoComplete = (e) => {
        if (e.target) {
            $('#q').val($(e.target).text());
            $('#search-form').submit();
        }
    };

    // On typing or focus in, show auto complete list.
    $('#q').on('input', _.debounce(fillAutoComplete, 100));
    $('#q').on('focusin', _.debounce(fillAutoComplete, 100));

    // On lost focus, destroy the list.
    $('body').on('click', hideList);

});
