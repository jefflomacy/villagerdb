import $ from "jquery";
import _ from 'underscore';

$(document).ready(() => {
    const fillAutoComplete = (e) => {
        let dataList = $('#qautocomplete');
        let q = $(e.target).val().trim();
        if (q.length === 0) {
            dataList.empty();
            return;
        }

        $.ajax({
            url: '/autocomplete?q=' + q,
            type: 'GET',
            dataType: 'json',
            success: (suggestions) => {
                dataList.empty();
                for (let s of suggestions) {
                    // If they typed an exact name, they know what they want, so don't show it anymore.
                    if (s.toLowerCase() !== q.toLowerCase()) {
                        dataList.append($('<option></option>').attr('value', s));
                    }
                }
            }
        });
    };

    $('#q').on('input', _.debounce(fillAutoComplete, 100));
});