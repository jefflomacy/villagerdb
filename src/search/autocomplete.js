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
                    dataList.append($('<option></option>').attr('value', s));
                }
            }
        });
    };

    $('#q').on('input', _.debounce(fillAutoComplete, 100));
});