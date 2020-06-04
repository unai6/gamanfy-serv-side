var express = require("express");
var router = express.Router();


/* GET home page!!. */
router.get('/', async (req, res, next) => {
  
  res.render('test', { title: 'Express title' });
});

module.exports = router;
