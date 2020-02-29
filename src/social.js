/**
 * Simple script to open a popup when users click on a social media sharing link.
 */
const $ = require('jquery');

$(document).ready(() => {
    // Social media buttons
    $('ul.share-buttons a.sharing-button').on('click', (e) => {
        e.preventDefault();
        if (e.currentTarget && e.currentTarget.href) {
            window.open(e.currentTarget.href, '_blank',
                'toolbar=no,menubar=no,scrollbars=yes,resizble=yes,width=600,height=600');
        }
    });

    // Copy link buttons
    $('ul.share-buttons a.linking-button').on('click', (e) => {
        e.preventDefault();
        if (e.currentTarget && e.currentTarget.href) {
            // Create a temporary element, select all the content in it, and then execute the copy command
            let tmp = document.createElement('textarea');
            tmp.value = e.currentTarget.href;
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);

            // Show success message.
            $(e.currentTarget).tooltip({
                'title': 'Link copied!'
            });
            $(e.currentTarget).tooltip('show');
        }
    });
});