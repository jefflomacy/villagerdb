/**
 * Basic middleware that populates some user state data so that every template can access it, if needed.
 *
 * @param req
 * @param res
 * @param next
 */
module.exports = (req, res, next) => {
    // Data storing if user is logged in.
    res.locals.userState = {}
    if (req.user) {
        res.locals.userState.isLoggedIn = typeof req.user.id !== 'undefined';
        res.locals.userState.isRegistered = typeof req.user.username !== 'undefined';
        res.locals.userState.username = req.user.username;
    }

    next();
};