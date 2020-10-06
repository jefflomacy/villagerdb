const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const hbs = require('express-handlebars');
const cron = require('./helpers/cron');
const passport = require('./config/passport');
const session = require('./config/session/middleware');
const appState = require('./helpers/middleware/app-state');

// Routers
const adminRouter = require('./routes/admin');
const indexRouter = require('./routes/index');
const autocompleteRouter = require('./routes/autocomplete');
const searchRouter = require('./routes/search');
const villagerRouter = require('./routes/villager');
const villagersRouter = require('./routes/villagers');
const itemRouter = require('./routes/item');
const itemsRouter = require('./routes/items');
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const listRouter = require('./routes/list/index');
const randomRouter = require('./routes/random');
const cmsRouter = require('./routes/cms');
const imageResizer = require('./routes/images');

const app = express();

// Handlebars setup
app.set('views', path.join(__dirname, 'views'));
const handlebars = hbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
});
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Do not send X-Powered-By header.
app.disable('x-powered-by');

// Initialize passport and session
app.set('trust proxy', 1) // trust first proxy since we run behind nginx
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use(appState);

// Set up admin router but fail if we can't.
if (!process.env.ADMIN_URL_KEY) {
    throw new Error('You must set ADMIN_URL_KEY in .env or I will not start.');
} else {
    app.use('/' + process.env.ADMIN_URL_KEY, adminRouter);
}

// Other routers setup.
app.use('/', indexRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/search', searchRouter);
app.use('/villager', villagerRouter);
app.use('/villagers', villagersRouter);
app.use('/item', itemRouter);
app.use('/items', itemsRouter);
app.use('/auth', authRouter);
app.use('/list', listRouter);
app.use('/user', userRouter);
app.use('/random', randomRouter);
app.use('/cms', cmsRouter);

// For image resizing.
app.use(imageResizer);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {
      pageTitle: 'Error'
  });
});

// Schedule crons
cron.scheduleCrons();

module.exports = app;