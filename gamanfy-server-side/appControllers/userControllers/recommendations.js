const mongoose = require("mongoose");
const express = require("express");
const InfluencerUser = require('../../models/InfluencerUser');
const CompanyUser = require("../../models/CompanyUser");
const Company = require('../../models/Company');
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');





exports.getUserRecommendationsDashboard = async (req, res) => {

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
      offerIdent = recInsideOffer.recommendedTimes[0]._id;
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



  exports.rejectRecommendation = async (req, res) => {
  
    try {
      const { offerId, recommendationId } = req.params;
  
      let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { recommendationAccepted: false, recommendationRejected: true }, { new: true })
      let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
      let offerIdent = recInsideOffer.recommendedTimes[0]._id
      let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes.$.recommendationRejected': true } }, { new: true })
      res.status(200).json(updatedOffer)
    } catch (error) {
      res.status(400).json({ error: 'An error occurred while updating' })
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
      <img style='height:6em'  src="cid:unique@nodemailer.com"/>
      
      <div style='width:25em; height:49.5em;'>
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em; height:2em'> ¡Hola ${recommendedFirstName}! <b>${influencerUserName}</b>  te ha recomendado <br/> para una oferta de trabajo en Gamanfy. </p>\n
      <img  src="cid:naranjaabstract@naranja.com" style='height:6em; display:inline-block'/>
      <div style='font-weight:300; color:#535353; font-size:14px ; width:33em; height:28em'>
      Puesto: ${jobName}<br/>
      Empresa: ${theCompany}<br/> 
      Salario base: ${minGrossSalary}-${maxGrossSalary}<br/>
      
      Misión principal del puesto de trabajo : ${mainMission}
      
      <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
      Si quieres ver la oferta completa  y enterarte de todo lo que Gamanfy </br>puede ofrecerte, haz click en <b><u><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:#535353; text-decoration:none'>Regístrarte</a> </u></b><br/>
          <button type='submit' style="border:none; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; height:3em; margin-top:2em; margin-left:9em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details-accept-rec/${theOffer._id}/${recommendedPeople._id}' style='color:white; text-decoration:none; font-weight:500'>Ver detalles de la oferta</a></button><br/>
          <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em; margin-top:4em'>¿No estas interesado ? Haz click <a href='${process.env.PUBLIC_DOMAIN}/recommend/user/reject-rec/${recommendedPeople._id}/${theOffer._id}' style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
          
        </div>
        
        </div>
        </div>
        <img  src="cid:abstract@abstract.com" style='height:9em; display:inline-block'/>
     
        `,
        attachments: [
          {
            filename: 'abstract-background_25-01.png',
          path: 'public/abstract-background_25-01.png',
          cid: 'abstract@abstract.com'
        },
        {
          filename: 'Anotación 2020-07-30 172748.png',
          path: 'public/Anotación 2020-07-30 172748.png',
          cid: 'unique@nodemailer.com'
        },
        {
          filename: 'nranja.abstract-background_6-01.png',
          path: 'public/nranja.abstract-background_6-01.png',
          cid: 'naranjaabstract@naranja.com'
        }
      ]
    };
    
    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
    
    res.status(200).json({ updatedUser })
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
    const curriculum = req.files.curriculum

    let recommendedPeople;
    let historicRecommendations;
    let recommendedTimes;
    
    if (req.files === null) {
      req.files =''
    } else{
      
      console.log(curriculum)
      recommendedPeople = await Recommended.create({
        recommendedEmail, recommendedFirstName, recommendedLastName, offerId: theOffer, recommendedPhoneNumber,
      recommendedLinkedin, howFoundCandidate, curriculum:curriculum.tempFilePath,
      candidateInfo: {
        candidateEducation, language, candidateLocation, experiences, similarExp, lastJob, age, ownDescription, motivations, whyFits,
        availability, moneyExpec, currentSituation, otherAspects
      },
      moneyForRec: companyUserMoneyPerRec
    });
    
    await curriculum.mv(`public/uploads/${curriculum.name}`, error => {
      if (error) {
        console.log(error);
      }
    })

    recommendedTimes = await Offers.findByIdAndUpdate(theOffer, {
      $push: { recommendedTimes: recommendedPeople }
    }, { new: true })
    
    historicRecommendations = recommendedPeople
    
    let companyUser = await CompanyUser.findByIdAndUpdate(influencerUserId.companyUser, { $inc: { 'companyUserPunctuation': 5 } }, { new: true })
    const updatedUser = await InfluencerUser.findByIdAndUpdate(influencerUserId, { $push: { recommendedPeople: recommendedPeople._id, historicRecommendations: historicRecommendations._id }, companyUser }, { new: true })

    let transporter =  nodemailer.createTransport({

      host: 'smtp.ionos.es',
      port: 587,
      logger: true,
      // debug: true,
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
      <img style='height:6em'  src="cid:unique@nodemailer.com"/>
      <div style='width:25em; height:49.5em;'>
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em; height:2em'> ¡Hola ${recommendedFirstName}! <b>${influencerUserName}</b>  te ha recomendado <br/> para una oferta de trabajo en Gamanfy. </p>\n
      <img  src="cid:naranjaabstract@naranja.com" style='height:6em; display:inline-block'/>
      <div style='font-weight:300; color:#535353; font-size:14px ; width:33em; height:28em'>
      Puesto: ${jobName}<br/>
      Empresa: ${theCompany}<br/> 
      Salario base: ${minGrossSalary}-${maxGrossSalary}<br/>
      
      Misión principal del puesto de trabajo : ${mainMission}
      
      <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
      Si quieres ver la oferta completa  y enterarte de todo lo que Gamanfy </br>puede ofrecerte, haz click en <b><u><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:#535353; text-decoration:none'>Regístrarte</a> </u></b><br/>
      <button type='submit' style="border:none; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; height:3em; margin-top:2em; margin-left:9em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details-accept-rec/${theOffer._id}/${recommendedPeople._id}' style='color:white; text-decoration:none; font-weight:500'>Ver detalles de la oferta</a></button><br/>
      <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em; margin-top:4em'>No estas interesado ? Haz click <a href=${process.env.PUBLIC_DOMAIN}/recommend/user/reject-rec/${recommendedPeople._id}/${theOffer._id} style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
      
      </div>
      
      </div>
      </div>
      <img  src="cid:abstract@abstract.com" style='height:9em; display:inline-block '/>
      `,
      attachments: [
        {
          filename: 'abstract-background_25-01.png',
          path: 'public/abstract-background_25-01.png',
          cid: 'abstract@abstract.com'
        },
        {
          filename: 'Anotación 2020-07-30 172748.png',
          path: 'public/Anotación 2020-07-30 172748.png',
          cid: 'unique@nodemailer.com'
        },
        {
          filename: 'nranja.abstract-background_6-01.png',
          path: 'public/nranja.abstract-background_6-01.png',
          cid: 'naranjaabstract@naranja.com'
        }
      ]
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
    res.status(200).send({ updatedUser })
  }
    
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while sending recommendation' })
  }
}