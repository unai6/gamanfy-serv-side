const createError = require('http-errors');

exports.isLoggedIn = () => (req, res, next) => {
  if (req.session.currentUser){
    console.log(req.session.currentUser)
  next()
  } 
  else res.status(401).json('no user logged');
};

exports.isNotLoggedIn = () => (req, res, next) => {
  if (!req.session.currentUser) next();
  else res.status(404).json('No session founded')
};

exports.validationLoggin = () => (req, res, next) => {
  const { email, password} = req.body;

  if (!email || !password) next(res.status(400).json('You must provide the specified fields'));
  else next();
}

exports.checkToken = (req, res, next) => {
  const header = req.headers['authorization'];

  if (typeof header !== 'undefined') {

      const bearer = header.split(' ');
      const token = bearer[1];

      req.token = token;

      next();
  } else {

      res.sendStatus(403);
  };
};