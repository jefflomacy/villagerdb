let getVersionedPath;
let middleware;

if (process.env.NODE_ENV === 'production') {
    // Only run staticify in production mode.
    const path = require('path');
    const staticify = require('staticify');
    const staticifyConfigured = staticify(path.join(process.cwd(), 'public'));
    middleware = staticifyConfigured.middleware;
    getVersionedPath = (path) => {
        return staticifyConfigured.getVersionedPath(path);
    };
} else {
    // Do not use staticify in development environments.
    getVersionedPath = (path) => {
        return path;
    };
    middleware = (req, res, next) => {
        return next();
    };
}

/**
 * Get the hashed version of a URL.
 * @param path
 */
module.exports.getVersionedPath = getVersionedPath;

/**
 * Staticify middleware.
 * @type {middleware}
 */
module.exports.middleware = middleware;