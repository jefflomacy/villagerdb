const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const lessMiddleware = require('less-middleware');
const favicon = require('serve-favicon');
const logger = require('morgan');
const hbs = require('express-handlebars');
const staticify = require('staticify');

const indexRouter = require('./routes/index');
const autocompleteRouter = require('./routes/autocomplete');
const villagersRouter = require('./routes/search');
const villagerRouter = require('./routes/villager');

const app = express();

// We only use staticify in production. In development, don't use it, and don't
// render versioned paths, either.
let getVersionedPath;
if (app.get('env') === 'production') {
    getVersionedPath = (path) => {
        return staticifyConfigured.getVersionedPath(path);
    }

    const staticifyConfigured = staticify(path.join(process.cwd(), 'public'));
    app.use(staticifyConfigured.middleware);
} else {
    getVersionedPath = (path) => {
        return path;
    }
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
const handlebars = hbs.create({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/',
    helpers: {
        getVersionedPath: getVersionedPath
    }
});
app.engine('hbs', handlebars.engine);
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Do not panic if favicon.ico can't be found.
try {
    app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
} catch (e) {
    console.log('Warning: favicon middleware reported an error. Skipping.');
}

// Everything styling related...
app.use(lessMiddleware(path.join(__dirname, 'public'),
    {once: app.get('env') === 'production'}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/webfonts/fa',
    express.static(path.join(__dirname, 'node_modules', '@fortawesome', 'fontawesome-free', 'webfonts')));
app.use('/webfonts/slick',
    express.static(path.join(__dirname, 'node_modules', 'slick-carousel', 'slick', 'fonts')));

// Do not send X-Powered-By header.
app.disable('x-powered-by');

// Router setup.
app.use('/', indexRouter);
app.use('/autocomplete', autocompleteRouter);
app.use('/villagers', villagersRouter);
app.use('/search', villagersRouter);
app.use('/villager', villagerRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
