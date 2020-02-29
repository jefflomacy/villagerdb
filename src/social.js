/**
 * Simple script to open a popup when users click on a social media sharing link.
 */
const $ = require('jquery');

$(document).ready(() => {
    $('ul.share-buttons a.sharing-button').on('click', (e) => {
        e.preventDefault();
        if (e.currentTarget && e.currentTarget.href) {
            window.open(e.currentTarget.href, '_blank',
                'toolbar=no,menubar=no,scrollbars=yes,resizble=yes,width=600,height=600');
        }
    });
});