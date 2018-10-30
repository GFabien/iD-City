  var createError = require('http-errors');
  var express = require('express');
  var path = require('path');
  var cookieParser = require('cookie-parser');
  var logger = require('morgan');
  var indexRouter = require('./routes/index');
  var ipfilter = require('express-ipfilter').IpFilter;

  // Declare cors (see npm cors)
  const cors = require('cors');

  // Configuring cors to make the back accessible from our front
  const corsOptions = {
    origin: '*',
    opitonsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
  }

  cors.corsOptions = corsOptions;

  var app = express();

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cors());

  // Whitelist the following IPs
  var ips = ['::1'];
  // Create the server
  app.use(ipfilter(ips, {mode: 'allow'}));

  app.use('/', indexRouter);

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