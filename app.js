const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const logger = require('morgan');
const fileUpload = require('express-fileupload');

const publicRouter = require('./routes/public');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const serviceRouter = require('./routes/service');

const corsOptions = {
  origin: [
    'http://80.93.182.76',
    'http://localhost'
  ],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public'))); // Temporary solution, static assets need to be served by nginx

app.use(cors(corsOptions));

app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/service', serviceRouter);
app.use('/', publicRouter);

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
  res.send({
    errorMessage: err.message
  });
});

module.exports = app;
