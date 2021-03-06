const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const send = require('send');

/**
 * Resizing rules based on entity type and requested size.
 */
const RESIZE_RULES = {
    items: {
        thumb: {
            width: 100,
            height: 100
        },
        medium: {
            width: 200,
            height: 200
        }
    },
    villagers: {
        thumb: {
            width: 100,
            height: 100
        },
        medium: {
            width: 200,
            height: 200
        }
    }
};

/**
 * HTTP header options for send module.
 */
const SEND_OPTIONS = {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0 // 1 year cache in prod
};

module.exports = (req, res, next) => {
    // Does it match an image url?
    const match = req.url.match(/^\/images\/([a-zA-z0-9]+)\/(medium|thumb)\/(.+)/);
    if (match) {
        const entityType = match[1];
        const size = match[2];
        const file = match[3];

        // Is it a valid entity type?
        if (!RESIZE_RULES[entityType] || !RESIZE_RULES[entityType][size]) {
            return next(); // bail
        }

        // Does the referenced file exist as a full image?
        const originalFile = path.join(process.cwd(), 'public', 'images', entityType, 'full', file);
        if (!fs.existsSync(originalFile)) {
            return next(); // bail
        }

        // Build the new file
        const newFile = path.join(process.cwd(), 'public', 'images', entityType, size, file);
        const extname = path.extname(newFile).toLowerCase();
        let resharp = sharp(originalFile)
            .resize(RESIZE_RULES[entityType][size].width, RESIZE_RULES[entityType][size].height,
                {
                    fit: 'inside',
                    withoutEnlargement: true
                });

        // If it's a JPEG, maintain full quality.
        if (extname === '.jpg' || extname === '.jpeg') {
            resharp.jpeg({
                quality: 100
            })
        }

        // Save to disk.
        resharp.toFile(newFile, (err, info) => {
            if (err) {
                return next(err); // bail!
            }

            // Send the new file with max age 1 year
            send(req, newFile, SEND_OPTIONS)
                .on('error', (err) => {
                    return next(err);
                })
                .pipe(res);
        });
    } else {
        return next(); // not found
    }
};