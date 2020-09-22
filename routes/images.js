module.exports = (req, res, next) => {
    const match = req.url.match(/^\/images\/([a-zA-z0-9]+)\/(medium|thumb)\/(.+)/);
    if (match) {
        const entityType = match[1];
        const size = match[2];
        const file = match[3];
        console.log(entityType + ' ' + size + ' ' + file + ' ');
        next(); // TODO remove
    } else {
        next();
    }

};