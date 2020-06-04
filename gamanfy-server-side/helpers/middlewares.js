const createError = require('http-errors');
const nodemailer = require('nodemailer');

exports.isLoggedIn = () => (req, res, next) => {
  if (req.session.currentUser){
    console.log(req.session.currentUser)
  next()
  } 
  else res.status(401).json('no user logged');
};

exports.isNotLoggedIn = () => (req, res, next) => {
  if (!req.session.currentUser) next();
  else next(createError(403));
};

exports.validationLoggin = () => (req, res, next) => {
  const { email, password} = req.body;

  if (!email || !password) next(res.status(400).json('You must provide the specified fields'));
  else next();
}
