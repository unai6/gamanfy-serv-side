const express = require("express");
const router = express.Router();
const InfluencerUser = require('../../models/InfluencerUser');
const Company = require('../../models/Company');
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');
const Address = require("../../models/Address");


router.get('/:userId/dashboard', async (req, res) => {

  try {
    const { userId } = req.params;


    await InfluencerUser.findById(userId)

      .populate({

        path: 'recommendedPeople',
        populate: {
          path: 'offerId',
          model: 'JobOffer',
          populate: {
            path: 'contractId addressId',
          }
        }
      }

      ).exec(function (err, offerIdPopulated) {
        if (err) {
          console.log(err)
        } else {
          res.status(200).json({ user: offerIdPopulated })
        }
      })


  } catch (error) {
    res.status(404).json({ error: 'No recommendations founded' })
  }
})

router.post('/:company/:offerId/:userId', async (req, res) => {

  try {

    const { company, userId, offerId } = req.params;
    const { recommendedEmail, recommendedFirstName, recommendedLastName } = req.body;
    const influencerUserId = await InfluencerUser.findById(userId).populate('recommendedPeople');
    const companyId = await Company.findById(company);
    const influencerUserName = `${influencerUserId.firstName} ${influencerUserId.lastName}`;
    const theCompany = companyId.companyName;
    const theOffer = await Offers.findById(offerId);
    const minGrossSalary = theOffer.retribution.minGrossSalary;
    const maxGrossSalary = theOffer.retribution.maxGrossSalary;
    
    let recommendedPeople = await Recommended.create({ recommendedEmail, recommendedFirstName, recommendedLastName })

    const updatedUser = await InfluencerUser.findByIdAndUpdate(userId, { $push: { recommendedPeople: recommendedPeople._id } }, { new: true })
    res.status(200).json({ updatedUser })

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
    transporter.use('compile', inLineCss());

    let mailOptions = {
      from: process.env.HOST_MAIL,
      to: recommendedEmail,
      subject: 'Gamanfy, recomendación laboral',
      html: `
      <style> div {font-weight:300; color:#050D4D;}</style>
      <div>
      Hola ${recommendedEmail}, has sido recomendado por <b>${influencerUserName}</b> para una oferta de trabajo en la empresa ${theCompany}.\n
      <div>
      Las condiciones que ofrece ${theCompany}, son las siguientes:<br/>
        - Salario: <b>${minGrossSalary}-${maxGrossSalary}</b>
      </div>
    Para más información haz click en el siguiente link y regístrate como Influencer para seguir adelante:<style> p {color:#050D4D; font-weight:600}> </style> <p>${process.env.PUBLIC_DOMAIN}/offer-details/${theOffer._id}</p>\n

    Si no te interesa la oferta haz click aquí <style> p {color:#050D4D; font-weight:600}> </style> <p>${process.env.PUBLIC_DOMAIN}/recommend/reject-rec/${recommendedPeople._id}</p>\n
    </div>
    `
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while sending recommendation' })
  }
});

router.post('/reject-rec/:recommendationId', async (req, res) => {
  try {
    const { recommendationId } = req.params;
    let { recommendationAccepted } = req.body;
    const rec = await Recommended.findById(recommendationId);
    const updatedRec = await Recommended.findByIdAndUpdate(rec._id, { recommendationAccepted }, { new: true })
    res.status(200).json(updatedRec)

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while retrieving recommendations' })
  }
});

module.exports = router