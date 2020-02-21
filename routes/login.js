const express = require('express');
const router = express.Router();

const appState = require('../helpers/app-state');

/* GET login page. */
router.get('/login', function(req, res, next) {
  const data = {
        pageTitle: 'Log In'
  };

  appState.getAppState(res)
      .then((state) => {
        Object.assign(data, state);
        res.render('login', data);
      })
      .catch(next);
});

module.exports = router;
