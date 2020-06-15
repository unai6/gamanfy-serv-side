const createError = require('http-errors');

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