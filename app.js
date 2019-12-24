const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const favicon = require('serve-favicon');
const logger = require('morgan');
const hbs = require('express-handlebars');
const staticify = require('./config/staticify');

const indexRouter = require('./routes/index');
const autocompleteRouter = require('./routes/autocomplete');
const searchRouter = require('./routes/search');
const villagerRouter = require('./routes/villager');
const villagersRouter = require('./routes/villagers');
const itemRouter = require('./routes/item');
const itemsRouter = require('./routes/items');
const randomRouter = require('./routes/random');

const app = express();

// Handlebars setup
app.set('views', path.join(__dirname, 'views'));
const handlebars = hbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        getVersionedPath: staticify.getVersionedPath
    }
});
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Setup favicon, but do not panic if favicon.ico can't be found.
try {
    app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
} catch (e) {
    console.log('Warning: favicon middleware reported an error. Skipping.');
    console.error(e);
}

// Everything styling related...
app.use(lessMiddleware(path.join(__dirname, 'public'),
    {once: app.get('env') === 'production'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/webfonts/fa',
    express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts')));
app.use('/webfonts/slick',
    express.static(path.join(__dirname, 'node_modules', 'slick-carousel', 'slick', 'fonts')));

// Staticify
app.use(staticify.middleware);

// Do not send X-Powered-By header.
app.disable('x-powered-by');

// Router setup.
app.use('/', indexRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/search', searchRouter);
app.use('/villager', villagerRouter);
app.use('/villagers', villagersRouter);
app.use('/item', itemRouter);
app.use('/items', itemsRouter);
app.use('/random', randomRouter);

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
  res.render('error');
});

module.exports = app;