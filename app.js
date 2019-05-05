const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const logger = require('morgan');
const rfs = require('rotating-file-stream');
const fileUpload = require('express-fileupload');

const env = process.env.NODE_ENV || 'development';
const config = require('./config/config')[env];

const publicRouter = require('./routes/public');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const serviceRouter = require('./routes/service');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());

const requestLogStream = rfs('requests.log', {
  interval: '1d',
  path: path.join(__dirname, 'logs')
});
console.log(config.logSettings.format);
app.use(logger(config.logSettings.format, { stream: requestLogStream }));
app.use(logger(config.logSettings.format, {
  skip: (req, res) => res.statusCode < 400 && config.logSettings.skipSuccess
}));

const corsOptions = {
  origin: config.corsWhiteList,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use('/user', userRouter);

app.use(express.static(path.join(__dirname, 'public'))); // Temporary solution, static assets need to be served by nginx
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
