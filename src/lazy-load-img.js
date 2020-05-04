/**
 * Easiest image lazy loading you can do really.
 */

/**
 *
 * @type {*|(function(...[*]=))}
 */
const $ = require('jquery');

$(document).ready(() => {
    let observer = undefined;
    if (typeof IntersectionObserver === 'function') {
        observer = new IntersectionObserver(onIntersection.bind(observer), {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
    }

    $('img.lazy-load').each(function(x, img) {
        if (observer) {
            observer.observe(img);
        } else {
            // Have to load the image...
            img.src = img.dataset.src;
        }
    })
});

function onIntersection(entries, observer) {
    // Loop through the entries
    entries.forEach(entry => {
        // Are we in viewport?
        if (entry.intersectionRatio > 0) {
            // Stop watching and load the image
            observer.unobserve(entry.target);
            entry.target.src = entry.target.dataset.src;
        }
    });
}