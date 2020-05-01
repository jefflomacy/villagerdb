/**
 * Generate an image for users to share their lists with.
 */

/**
 * Canvas object ID.
 *
 * @type {string}
 */
const CANVAS_ID = 'generated-list-image';

/**
 * Maximum image width we will draw.
 *
 * @type {number}
 */
const MAX_IMAGE_WIDTH = 50;

/**
 * Maximum image height we will draw.
 * @type {number}
 */
const MAX_IMAGE_HEIGHT = 75;

/**
 * Image locations on canvas.
 *
 * @type {({x: number, y: number})[]}
 */
const IMAGE_POSITIONS = [
    {x: 225, y: 20}, // Row 1, col 3
    {x: 225, y: 230}, // Row 2, col 3
    {x: 150, y: 40}, // Row 1, col 2
    {x: 300, y: 250}, // Row 2, col 4
    {x: 300, y: 40}, // Row 1, col 4
    {x: 150, y: 250}, // Row 2, col 2
    {x: 375, y: 20}, // Row 1, col 5
    {x: 75, y: 230}, // Row 2, col 1
    {x: 75, y: 20}, // Row 1, col 1
    {x: 375, y: 230} // Row 2, col 5
];

/**
 * How far down the canvas the list name is shown.
 * @type {number}
 */
const LIST_NAME_POS_Y = 150;

/**
 * Location of URL.
 * @type {number}
 */
const USERNAME_POS_Y = 185;

/**
 * Canvas font to use.
 * @type {string}
 */
const CANVAS_FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"';

/**
 * Background fills.
 * @type {string[]}
 */
const BACKGROUND_COLORS = [
    '#c1e3fd',
    '#fcf9e1'
];

/**
 * Text color.
 *
 * @type {string}
 */
const STROKE_COLOR = '#817157';

/**
 * jQuery
 * @type {*|(function(...[*]=))}
 */
const $ = require('jquery');

/**
 * Array of list images on the page. Computed on DOM ready so that search does not disrupt the generator.
 * @type {*[]}
 */
let images = [];

$(document).ready(() => {
    // Collect all the images and filter out the ones that are placeholders.
    images = $('img.user-list-image').toArray()
        .filter((i) => {
            return typeof i !== 'undefined' && typeof i.src === 'string' &&
                i.src.indexOf('image-not-available') === -1;
        });

    // Generate image button click
    $('#generate-image-button').on('click', (e) => {
        const listName = $(e.target).data('list-name');
        const userUrl = 'villagerdb.com/user/' + $(e.target).data('user-name');
        // Canvas context.
        const canvas = document.getElementById(CANVAS_ID);
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');

        // Fill with background color.
        ctx.fillStyle = randomValueOf(BACKGROUND_COLORS);
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw wishlist name.
        ctx.font = '30px ' + CANVAS_FONT;
        ctx.fillStyle = STROKE_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText(listName, canvas.width / 2, LIST_NAME_POS_Y);

        // Draw username url
        ctx.font = '20px ' + CANVAS_FONT;
        ctx.fillStyle = STROKE_COLOR;
        ctx.textAlign = 'center';
        ctx.fillText(userUrl, canvas.width / 2, USERNAME_POS_Y);

        // Shuffle the images.
        shuffle(images);

        // Draw until we reach the end of the positions set.
        let count = 0;
        for (let pos of IMAGE_POSITIONS) {
            if (count >= images.length) {
                break;
            }
            drawImage(ctx, images[count], pos.x, pos.y);
            count++;
        }

        // Render canvas to img tag.
        $('#canvas-target').attr('src', canvas.toDataURL('image/png'));
        $('#canvas-target').show();
    });
});

/**
 * Draws image and scales it to max width and height if needed.
 * @param ctx
 * @param image
 * @param x
 * @param y
 */
function drawImage(ctx, image, x, y) {
    if (!image) {
        return;
    }

    let scale = 1;
    let scaleX = image.width / MAX_IMAGE_WIDTH;
    let scaleY = image.height / MAX_IMAGE_HEIGHT;
    if (scaleX > 1 || scaleY > 1) {
        if (scaleX > scaleY) {
            scale = scaleX;
        } else {
            scale = scaleY;
        }
    }

    const newWidth = image.width / scale;
    const newHeight = image.height / scale;
    console.log(image.width +'|' + image.height + '; ' + scaleX + ';' + scaleY + '; ' + newWidth + ' ; ' + newHeight);
    ctx.drawImage(image, x, y, newWidth, newHeight);
}

/**
 * Take an array as input, shuffle it up and return it.
 *
 * @param array []
 * @returns []
 */
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Return random element of the given array.
 * @param array
 * @returns {undefined|*}
 */
function randomValueOf(array) {
    if (array.length === 0) {
        return undefined;
    } else if (array.length === 1) {
        return array[0];
    } else {
        let val = Math.floor(Math.random() * (array.length)) - 1;
        if (val < 0) {
            val = 1;
        }
        return array[val];
    }
}