var express = require("express");
var router = express.Router();


/* GET home page!!. */
router.get('/', async (req, res, next) => {
  
  res.render('test', { title: 'Express' });
});

module.exports = router;
