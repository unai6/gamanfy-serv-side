const mongoose = require("mongoose");
const express = require("express");
const InfluencerUser = require('../../models/InfluencerUser');
const CompanyUser = require("../../models/CompanyUser");
const Company = require('../../models/Company');
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');
const multer = require('multer');



exports.uploadPDF = (req, res) => {
  
  var storage = multer.diskStorage({
    destination: function (req, file, cb) {
    cb(null, 'curriculums')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname )
  }
  })
  
  var upload = multer({ storage: storage }).single('file')
  
  upload(req, res, function (err) {
         if (err instanceof multer.MulterError) {
             return res.status(500).json(err)
         } else if (err) {
             return res.status(500).json(err)
         }
    return res.status(200).send(req.file)

  })

};

exports.getUserRecommendationsDashboard =  async (req, res) => {

  try {
    const { userId } = req.params;
    await InfluencerUser.findById(userId)

      .populate([{

        path: 'recommendedPeople companyUser',
        populate: {
          path: 'offerId',
          populate: [{
            path: 'contractId addressId'
          }, {

            path: 'companyData.companyId',
            model: 'Company',
            populate: {
              path: 'postedOffers',

            }
          }]
        }
      }]

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
}
exports.deleteRecommendation = async (req, res) => {
  const { userId, recommendationId, offerId } = req.params;
  try {
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent;
    
    if (offerIdent !== undefined) {   
      offerIdent  = recInsideOffer.recommendedTimes[0]._id;
      await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $pull: { recommendedTimes: { $in: [recommendationId] } } }, { multi: true })
    } else {
      
      await Recommended.findByIdAndRemove(recommendationId);
      await InfluencerUser.findByIdAndUpdate(userId, { $pull: { recommendedPeople: { $in: [recommendationId] } } }, { multi: true });
    }

    res.status(200).json({ message: 'offer deleted successfully' })

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while deleting recommendation' })
  }
};

exports.influencerUserRecommendation = async (req, res) => {

  try {
    const { idCompany, idUser, idOffer } = req.params;
    const { recommendedEmail, recommendedFirstName, recommendedLastName, whyRec, recommendedAge, recommendedLinkedin, recommendedPhoneNumber,
    } = req.body;

    const theOffer = await Offers.findById(idOffer);
    const influencerUserId = await InfluencerUser.findById(idUser).populate('recommendedPeople');
    const influencerUserMoneyperRec = influencerUserId.influencerUserPunctuation;
    const influencerUserName = `${influencerUserId.firstName} ${influencerUserId.lastName}`;
    const companyId = await Company.findById(idCompany)
    const theCompany = companyId.companyName;
    const minGrossSalary = theOffer.retribution.minGrossSalary;
    const maxGrossSalary = theOffer.retribution.maxGrossSalary;
    const jobName = theOffer.jobOfferData.jobName
    const mainMission = theOffer.jobDescription.mainMission
    
    let recommendedPeople;
    let historicRecommendations;
    let recommendedTimes;
    recommendedPeople = await Recommended.create({
      recommendedEmail, recommendedFirstName, recommendedLastName, recommendedLinkedin, offerId: theOffer,
      whyRec, recommendedPhoneNumber, recommendedAge, moneyForRec: influencerUserMoneyperRec
    });

    recommendedTimes = await Offers.findByIdAndUpdate(theOffer, {
      $push: { recommendedTimes: recommendedPeople }
    }, { new: true })

    historicRecommendations = recommendedPeople

    const updatedUser = await InfluencerUser.findByIdAndUpdate(influencerUserId, { $push: { recommendedPeople: recommendedPeople._id, historicRecommendations: historicRecommendations._id, recommendedTimes: recommendedTimes._id }, $inc: { 'influencerUserPunctuation': 5 } }, { new: true })
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
      <div style='font-weight:300; color:#535353; font-size:14px ; width:33em'>

        Puesto: ${jobName}<br/>
        Empresa: ${theCompany}<br/> 
        Salario: ${minGrossSalary}-${maxGrossSalary}<br/>

        Misión principal del puesto de trabajo : ${mainMission}
      
        </div>
        <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
        Si quieres ver la oferta completa  y enterarte de todo lo que Gamanfy </br>puede ofrecerte, haz click en <b><u><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:#535353; text-decoration:none'>Regístrarte</a> </u></b><br/>
        <button type='submit' style="border:none; background:rgb(255,188,73); border-radius:5px; width:14em; height:2.5em; margin-top:2em; margin-left:11em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details/${theOffer._id}' style='color:white; text-decoration:none; font-weight:500'>Ver oferta completa</a></button><br/>
        </div>
    
     <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em'>No estas interesado ? Haz click <a href=${process.env.PUBLIC_DOMAIN}/recommend/reject-rec/${recommendedPeople._id} style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
    </div>
    `,
      attachments: [{
        filename: 'Anotación 2020-07-30 172748.png',
        path: 'public/Anotación 2020-07-30 172748.png',
        cid: 'unique@nodemailer.com'
      }]
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
  } catch (error) {
    console.log(error)
  }
}

exports.companyUserRecommendation = async (req, res) => {

  try {
    const { company, userId, offerId } = req.params;
    const { recommendedEmail, recommendedFirstName, recommendedLastName, recommendedPhoneNumber,
      recommendedLinkedin, howFoundCandidate, candidateEducation, lastJob, age, language, candidateLocation, experiences, similarExp,
      ownDescription, motivations, whyFits,
      availability, moneyExpec, currentSituation, otherAspects } = req.body;
     


    const theOffer = await Offers.findById(offerId);
    const influencerUserId = await InfluencerUser.findById(userId).populate('recommendedPeople companyUser');
    const companyUserMoneyPerRec = influencerUserId.companyUser.companyUserPunctuation;
    const influencerUserName = `${influencerUserId.firstName} ${influencerUserId.lastName}`;
    const companyId = await Company.findById(company)
    const theCompany = companyId.companyName;
    const minGrossSalary = theOffer.retribution.minGrossSalary;
    const maxGrossSalary = theOffer.retribution.maxGrossSalary;
    const jobName = theOffer.jobOfferData.jobName
    const mainMission = theOffer.jobDescription.mainMission

    let recommendedPeople;
    let historicRecommendations;
    let recommendedTimes;

    recommendedPeople = await Recommended.create({
      recommendedEmail, recommendedFirstName, recommendedLastName, offerId: theOffer, recommendedPhoneNumber,
      recommendedLinkedin, howFoundCandidate,
      candidateInfo: {
        candidateEducation, language, candidateLocation, experiences, similarExp, lastJob, age, ownDescription, motivations, whyFits,
        availability, moneyExpec, currentSituation, otherAspects
      },
      moneyForRec: companyUserMoneyPerRec
    });

    recommendedTimes = await Offers.findByIdAndUpdate(theOffer, {
      $push: { recommendedTimes: recommendedPeople }
    }, { new: true })

    historicRecommendations = recommendedPeople

    let companyUser = await CompanyUser.findByIdAndUpdate(influencerUserId.companyUser, { $inc: { 'companyUserPunctuation': 5 } }, { new: true })
    const updatedUser = await InfluencerUser.findByIdAndUpdate(influencerUserId, { $push: { recommendedPeople: recommendedPeople._id, historicRecommendations: historicRecommendations._id }, companyUser }, { new: true })

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

        Misión principal del puesto de trabajo : ${mainMission}

        </div>
        <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
        Si quieres ver la oferta completa  y enterarte de todo lo que Gamanfy </br>puede ofrecerte, haz click en <b><u><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:#535353; text-decoration:none'>Regístrarte</a> </u></b><br/>
        <button type='submit' style="border:none; background:rgb(255,188,73); border-radius:5px; width:14em; height:2.5em; margin-top:2em; margin-left:11em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details/${theOffer._id}' style='color:white; text-decoration:none; font-weight:500'>Ver oferta completa</a></button><br/>
        </div>
        
     <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em'>No estas interesado ? Haz click <a href=${process.env.PUBLIC_DOMAIN}/recommend/reject-rec/${recommendedPeople._id} style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
     </div>
     `,
      attachments: [{
        filename: 'Anotación 2020-07-30 172748.png',
        path: 'public/Anotación 2020-07-30 172748.png',
        cid: 'unique@nodemailer.com'
      }]
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
    res.status(200).json({ updatedUser })

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while sending recommendation' })
  }
}