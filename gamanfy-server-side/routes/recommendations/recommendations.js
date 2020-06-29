const express = require("express");
const router = express.Router();
const InfluencerUser = require('../../models/InfluencerUser');
const Company = require('../../models/Company');
const Offers = require('../../models/JobOffer.js');
const nodemailer = require('nodemailer');

router.post('/:company/:offerId/:userId', async (req, res) => { 

    const {company, userId, offerId} = req.params;
    const {email} = req.body;
    const influencerUserId = await InfluencerUser.findById(userId);
    console.log('user', influencerUserId);
    const companyId = await Company.findById(company);
    console.log('company', company)
    const influencerUserName = influencerUserId.firstName;
    const theCompany = companyId.companyName
    const theOffer = await Offers.findById(offerId)
    console.log('offer', theOffer)

  let transporter = nodemailer.createTransport({

    host: 'smtp.ionos.es',
    port: 587,
    logger: true,
    debug: true,
    tls: {
      secure: false,
      ignoreTLS: true,
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.HOST_MAIL,
      pass: process.env.HOST_MAIL_PASSWORD
    },

  });

  let mailOptions = {
    from: process.env.HOST_MAIL,
    to: email,
    subject: 'Gamanfy, recomendación laboral',
    text: `Hola ${email}, has sido recomendado por ${influencerUserName} para una oferta de trabajo en la empresa ${theCompany}.
    Para más información haz click en el siguiente link y registrate como Influencer para seguir adelante: ${process.env.PUBLIC_DOMAIN}/offer-details/${theOffer._id}\n `
  };

  transporter.sendMail(mailOptions, function (err) {
    if (err) { return res.status(500).send({ msg: err.message }); }
    res.status(200).send('A verification email has been sent to ' + email + '.');
  });

  res.status(200).json({mssg: 'The email has been sent successfully'})


  
})


module.exports = router