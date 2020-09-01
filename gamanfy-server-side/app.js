
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const hbs = require('hbs')
const bodyParser = require("body-parser");
const indexRouter = require('./routes/index');
const userAuthRouter = require('./routes/auth/userAuth.js');
const companyAuthRouter = require('./routes/auth/companyAuth.js');
const offersRouter = require('./routes/offers/offers.js');
const recommendationsRouter = require('./routes/recommendations/recommendations.js')


const app = express();


app.set('port', process.env.PORT || 5000);


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
        origin:["http://localhost:3000", "https://gamanfy-c2371.web.app", "http://fontawesome.com", 'https://app.gamanfy.com']
      })
      );  


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/public',  express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', userAuthRouter);
app.use('/auth-co', companyAuthRouter);
app.use('/offers', offersRouter);
app.use('/recommend', recommendationsRouter)




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

