import $ from "jquery";
import _ from 'underscore';

/**
 * Up arrow key code.
 * @type {number}
 */
const UP_KEYCODE = 38;

/**
 * Down arrow key code.
 * @type {number}
 */
const DOWN_KEYCODE = 40;

/**
 * Escape keycode.
 * @type {number}
 */
const ESC_KEYCODE = 27;

/**
 * The currently-executing request. We cancel it if concurrent ones are happening.
 */
let currentRequest;

$(document).ready(() => {
    /**
     * Autocomplete unordered list
     * @type {jQuery|HTMLElement}
     */
    const dataList = $('#autocomplete-items');

    /**
     * Up/down arrow and escape key handler for autocomplete items
     * @param e
     */
    const keyDownHandler = (e) => {
        if (e.keyCode === UP_KEYCODE || e.keyCode === DOWN_KEYCODE) {
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
                if (e.keyCode === UP_KEYCODE) {
                    newSelected = items.eq((items.index(currentSelected) - 1) % items.length)
                } else { // down
                    newSelected = items.eq((items.index(currentSelected) + 1) % items.length)
                }
            } else {
                if (e.keyCode === UP_KEYCODE) {
                    newSelected = $('#autocomplete-items li').last();
                } else { // down
                    newSelected = $('#autocomplete-items li').first();
                }
            }

            // If we have a new selection...
            if (newSelected && newSelected.length > 0) {
                newSelected.addClass('selected');
                $('#q').val(newSelected.text());
            }
        } else if (e.keyCode === ESC_KEYCODE) {
            // Just make the list go away.
            e.preventDefault();
            hideList();
        }
    }

    /**
     * Make the list visible.
     */
    const showList = () => {
        $(window).on('keydown', keyDownHandler);
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
