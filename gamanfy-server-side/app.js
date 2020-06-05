const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('hbs')

const indexRouter = require('./routes/index');
const userAuthRouter = require('./routes/auth/userAuth.js');
const companyAuthRouter = require('./routes/auth/companyAuth.js');
const offersRouter = require('./routes/offers/offers.js');


const app = express();


app.set('port', process.env.PORT || 3000);


// MONGOOSE CONNECTION
mongoose
  .connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    keepAlive: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })
  .then(() => console.log(`Connected to database`))
  .catch((err) => console.error(err));

  // CORS MIDDLEWARE SETUP
  app.use(
    cors({
      credentials: true,
      origin: [process.env.PUBLIC_DOMAIN],
      methods:['GET,HEAD,PUT,PATCH,POST,DELETE'],
      allowedHeaders:'Content-Type,Authorization',
      preflightContinue:false,
      optionsSuccessStatus:204,
      maxAge:3600
    })
    );  


// SESSION MIDDLEWARE
app.use(
  session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 24 * 60 * 60, // 1 day
    }),
    secret: process.env.SECRET_SESSION,
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', userAuthRouter);
app.use('/auth-co', companyAuthRouter);
app.use('/offers', offersRouter);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});



// error handler
/* app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}); */

module.exports = app;

