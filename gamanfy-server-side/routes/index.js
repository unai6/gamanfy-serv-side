var express = require("express");
var router = express.Router();


/* TEMPLATES FOR EMAILS. */
router.get('/welcome-company', async (req, res, next) => {
  
  res.render('messageWelcomeCompany');
});

router.get('/reject-candidate', async (req, res, next) => {
  
  res.render('rejectCandidateForInfluencer');
});

module.exports = router;
