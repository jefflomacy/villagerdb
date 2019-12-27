const express = require('express');
const router = express.Router();

const appState = require('../helpers/app-state');

/* GET home page. */
router.get('/', function(req, res, next) {
  const data = {
        pageTitle: 'Home'
  };

  appState.getAppState(res)
      .then((state) => {
        Object.assign(data, state);
        res.render('index', data);
      })
      .catch(next);
});

module.exports = router;
