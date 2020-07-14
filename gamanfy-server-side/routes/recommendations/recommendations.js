const express = require("express");
const router = express.Router();
const InfluencerUser = require('../../models/InfluencerUser');
const Company = require('../../models/Company');
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');

const sendRecommendation = require('../../appControllers/companyControllers/recommend');


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
    const { recommendedEmail, recommendedFirstName, recommendedLastName, whyRec, recommendedPhoneNumber,
      recommendedLinkedin, curriculum, howFoundCandidate, candidateEducation, language, candidateLocation, experiences, similiarExp,
       ownDescription, motivations, whyFits,
      availability, moneyExpec, currentSituation, otherAspects } = req.body;
    const influencerUserId = await InfluencerUser.findById(userId).populate('recommendedPeople');
    const companyId = await Company.findById(company);
    const influencerUserName = `${influencerUserId.firstName} ${influencerUserId.lastName}`;
    const theCompany = companyId.companyName;
    const theOffer = await Offers.findById(offerId);
    const minGrossSalary = theOffer.retribution.minGrossSalary;
    const maxGrossSalary = theOffer.retribution.maxGrossSalary;
    const jobName = theOffer.jobOfferData.jobName

    let recommendedPeople;
    
    if (influencerUserId.isCompany === true) {
      
      recommendedPeople = await Recommended.create({
        recommendedEmail, recommendedFirstName, recommendedLastName, offerId: theOffer, recommendedPhoneNumber, 
        recommendedLinkedin, howFoundCandidate,
        candidateInfo: {
          candidateEducation, language, candidateLocation, experiences, similiarExp, ownDescription, motivations, whyFits,
          availability, moneyExpec, currentSituation, otherAspects }
      });

      
    } else {
      recommendedPeople = await Recommended.create({
        recommendedEmail, recommendedFirstName, recommendedLastName, offerId: theOffer,
        whyRec, recommendedPhoneNumber
      })
      
    }

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
      subject: 'Gamanfy, ¡Te damos la bienvenida!',
      html: `
     <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
      <div>
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${recommendedFirstName}! <b>${influencerUserName}</b>  te ha recomendado <br/> para una oferta de trabajo en Gamanfy. </p>\n
      <div style='font-weight:300; color:#535353; font-size:14px'>

        Puesto: ${jobName}<br/>
        Empresa: ${theCompany}<br/>
        Salario: ${minGrossSalary}-${maxGrossSalary}<br/>
      
        </div>
        <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
        Si quieres ver la oferta completa  y enterarte de todo lo que Gamanfy </br>puede ofrecerte, haz click en <b><u><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:#535353; text-decoration:none'>Regístrarte</a> </u></b><br/>
        <button type='submit' style="border:none; background:rgb(255,188,73); border-radius:5px; width:14em; height:2.5em; margin-top:2em; margin-left:11em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details/${theOffer._id}' style='color:white; text-decoration:none; font-weight:500'>Ver oferta completa</a></button><br/>
        </div>
    
     <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em'>No estas interesado ? Haz click <a href=${process.env.PUBLIC_DOMAIN}/recommend/reject-rec/${recommendedPeople._id} style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
    </div>
    `,
      attachments: [{
        filename: 'logo-gamanfy-email.png',
        path: 'public/logo-gamanfy-email.png',
        cid: 'unique@nodemailer.com'
      }]
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


router.post('/:companyId', sendRecommendation.recommend);


module.exports = router