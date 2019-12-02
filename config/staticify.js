const path = require('path');
const staticify = require('staticify');

// Configure staticify to send a short-lived cache in non-production environments.
const staticifyOpts = {};
if (process.env.NODE_ENV !== 'production') {
    staticifyOpts.sendOptions = {maxAge: 1};
}
const staticifyConfigured = staticify(path.join(process.cwd(), 'public'), staticifyOpts);

/**
 * Get the hashed version of a URL.
 * @param path
 */
const getVersionedPath = (path) => {
    return staticifyConfigured.getVersionedPath(path);
}

module.exports.middleware = staticifyConfigured.middleware;
module.exports.getVersionedPath = getVersionedPath;