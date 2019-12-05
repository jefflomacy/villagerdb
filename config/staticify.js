const path = require('path');
const staticify = require('staticify');

// Configure staticify to send a short-lived cache in non-production environments.
const staticifyOpts = {};
if (process.env.NODE_ENV !== 'production') {
    staticifyOpts.sendOptions = {maxAge: 1};
}
const staticifyConfigured = staticify(path.join(process.cwd(), 'public'), staticifyOpts);

// Set up getVersionedPath function. In non-production environments, we do not returned hashed paths.
let getVersionedPath;
if (process.env.NODE_ENV !== 'production') {
    getVersionedPath = (path) => {
        return path;
    }
} else {
    getVersionedPath = (path) => {
        return staticifyConfigured.getVersionedPath(path);
    }
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
module.exports.middleware = staticifyConfigured.middleware;