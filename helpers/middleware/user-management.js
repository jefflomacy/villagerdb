const users = require('../../db/entity/users');

module.exports = (req, res, next) => {

    // Request URL and URLs that need to be reachable if a user is in the registration process.
    const requestUrl = req.originalUrl;
    const reachableUrls = [
        '/auth/register',
        '/auth/register-post',
        '/auth/register-cancel',
        '/auth/logout'
    ]

    // Data storing if user is logged in.
    res.locals.userState = {}
    if (req.session.passport) {
        res.locals.userState.isLoggedIn = req.session.passport.user.id;
        res.locals.userState.googleId = req.session.passport.user.googleId;
        res.locals.userState.isNewUser = req.session.passport.user.isNewUser;

        users.findUserByGoogleId(res.locals.userState.googleId)
            .then((user) => {
                res.locals.userState.username = user.username;
            });
    }

    // Redirect unregistered users registration page if logged in.
    users.isRegistered(res.locals.userState.googleId)
        .then((isRegistered) => {
            res.locals.userState.isRegistered = isRegistered;

            if (res.locals.userState.isLoggedIn) {
                if (res.locals.userState.isRegistered) {
                    next();
                } else {
                    if (reachableUrls.indexOf(requestUrl) >= 0) {
                        next();
                    } else {
                        res.redirect('/auth/register');
                    }
                }
            } else {
                next();
            }
        });

};