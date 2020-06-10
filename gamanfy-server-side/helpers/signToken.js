const jwt = require('jsonwebtoken');

exports.signToken = (user, remember) => {
  const options = {}
  /* const rememberParsed = JSON.parse(remember) */
  if(remember) {
    options.expiresIn = '999y'
  } else {
    options.expiresIn = '24h' 
  }
  return (jwt.sign({id: user.id}, process.env.SECRET_KEY, options))
}