/**
 * @file Export an express API app
 */

//Include Libraries
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
let fs = require("fs");


//launching express
var app = express();


////////////Whitelisting IPs////////////
// Initialize ipfilter
var ipfilter = require('express-ipfilter').IpFilter;
const ipfilteroptions = {
    mode: 'allow',
    allowedHeaders: ['x-forwarded-for']
};

// Read whitelist file at server start
let contents = fs.readFileSync("./config/whitelist.json");
let ips = JSON.parse(contents).ips;

// If whitelist is changed, variable whitelistchanged take the value true
const chokidar = require('chokidar');
const watcher = chokidar.watch('./config/whitelist.json')
let whitelistchanged = false;
watcher.on('change', (path) => {
    whitelistchanged = true;
    console.log(`File ${path} changed | whitelistchanged: `, whitelistchanged);
});

//Get Ips --> if whitelist.json is changed the ips whitelist is reloaded else we return the same whitelist
getIps = function() {
    if (whitelistchanged) {
        console.log('reload whitelist');
        contents = fs.readFileSync("./config/whitelist.json");
        ips = JSON.parse(contents).ips;
        whitelistchanged = false;
    }
    return (ips);
};
app.use(ipfilter(getIps, ipfilteroptions));
////////////end whitelisting ip////////////


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//other middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use('/', indexRouter);


// Use cors
const cors = require('cors');
const corsOptions = {
    origin: '*',
    opitonsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
cors.corsOptions = corsOptions;
app.use(cors());


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