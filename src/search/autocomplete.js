import $ from "jquery";
import _ from 'underscore';

$(document).ready(() => {
    /**
     * Make the list invisible.
     */
    const hideList = () => {
        $('#autocomplete-items').hide();
    };

    /**
     * Get the list from the server.
     * @param e
     */
    const fillAutoComplete = (e) => {
        const dataList = $('#autocomplete-items');
        dataList.empty();
        const q = $(e.target).val().trim();
        if (q.length === 0) {
            return;
        }

        $.ajax({
            url: '/autocomplete?q=' + q,
            type: 'GET',
            dataType: 'json',
            success: (suggestions) => {
                dataList.show();
                for (let s of suggestions) {
                    const elem = $('<li></li>')
                        .text(s)
                        .on('click', doAutoComplete);
                    dataList.append(elem);
                }
            }
        });
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