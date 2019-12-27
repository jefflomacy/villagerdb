
module.exports = (req, res, next) => {
    res.locals.userState = {}
    if (req.session.passport) {
        res.locals.userState.isLoggedIn = req.session.passport.user.id;
        res.locals.userState.googleId = req.session.passport.user.googleId;
        res.locals.userState.isNewUser = req.session.passport.user.isNewUser;
    }
    next();
};
