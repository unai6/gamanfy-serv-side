const mongoose = require("mongoose");
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
};

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
    const { recommendedEmail, recommendedFirstName, recommendedLastName, whyRec, recommendedAge, recommendedLinkedin, recommendedPhoneNumber } = req.body;

    const theOffer = await Offers.findById(idOffer);
    const influencerUserId = await InfluencerUser.findById(idUser).populate('recommendedPeople');
    const recommendedBy = influencerUserId.email;
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
      whyRec, recommendedPhoneNumber, recommendedAge, moneyForRec: influencerUserMoneyperRec,
      candidateInfo: {
        candidateEducation: '', language: '', candidateLocation: '', experiences: '', similarEx: '', lastJob: '', age: '', ownDescription: '', motivations: '', whyFits: '',
        availability: '', moneyExpec: '', currentSituation: '', otherAspects: ''
      },
      recommendedBy,
      influencerUserName,
    });

    recommendedTimes = await Offers.findByIdAndUpdate(theOffer, {
      $push: { recommendedTimes: recommendedPeople }
    }, { new: true })

    historicRecommendations = recommendedPeople

    const updatedUser = await InfluencerUser.findByIdAndUpdate(influencerUserId, { $push: { recommendedPeople: recommendedPeople._id, historicRecommendations: historicRecommendations._id, recommendedTimes: recommendedTimes._id }, $inc: { 'influencerUserPunctuation': 20 } }, { new: true })

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
      
      <div style='width:25em; height:63.5em;'>
      <p style='font-weight:600; color:#535353; font-size:18px; text-align:center; height:2em'> ¡Hola ${recommendedFirstName}! <b>${influencerUserName}</b>  te ha recomendado <br/> para una oferta de trabajo en Gamanfy. </p>\n
      <img  src="cid:naranjaabstract@naranja.com" style='height:6em; display:inline-block'/>
      <div style='font-weight:300; color:#535353; font-size:14px ; width:33em; height:28em'>
      <b>Puesto:</b> ${jobName}<br/>
      <b>Empresa:</b> ${theCompany}<br/> 
      <b>Salario base:</b> ${minGrossSalary}-${maxGrossSalary}<br/>
      

      
      <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
      <p> Si quieres ver la oferta completa haz clic en este botón y podrás inscribirte a la oferta de manera sencilla.</p>
          <button type='submit' style="border:none; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; height:3em; margin-top:2em; margin-left:9em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details-accept-rec/${theOffer._id}/${recommendedPeople._id}' style='color:white; text-decoration:none; font-weight:500'>Ver detalles de la oferta</a></button><br/>
          
          <p>¿Cómo funciona el proceso de selección Gamanfy?</p>

          <p>Es muy sencillo:</p>
          <ol>
      <li>Examina con atención la oferta de trabajo.</li>
      <li>Si estas interesado/a haz clic en el botón que encontraras debajo de la oferta de trabajo “Aceptar Recomendación y Registrarse”</li>
      <li>Ya está todo hecho. Si tu perfil se ajusta a la oferta de trabajo recibirás un e-mail para realizar una primera entrevista.</li>
      </ol>
      
      <p>¿No estas interesado?</p>
      <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em; margin-top:4em'>¿No estas interesado ? Haz click <a href='${process.env.PUBLIC_DOMAIN}/recommend/user/reject-rec/${recommendedPeople._id}/${theOffer._id}' style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
      <p style='tex-align:center'><b>Tu también puedes transfórmate en un influencer de talento</b><p>
      <p>Gamanfy es la primera plataforma que te permite recomendar a tus mejores contactos para una oferta de trabajo y cobrar por ello. </p>
      <p>Para mas información, visita nuestra pagina https://gamanfy.com/influencers</p>
      <p>Saludos, <br/> el Equipo de Gamanfy<p>

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

    let mailOptionsToGamanfy = {
      from: process.env.HOST_MAIL,
      to: 'gamanfy@gmail.com',
      subject: 'Gamanfy, Recomendaciones',
      html: `
      ${influencerUserName} con email ${recommendedBy} ha hecho una nueva recomendación para la oferta ${jobName}.
      Nombre del candidato: ${recommendedFirstName},\n
      Email del candidato: ${recommendedEmail},

      ID Empresa: ${idCompany}
      ID Influencer: ${influencerUserId._id}
      ID Oferta: ${idOffer}
      `
    }

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
    transporter.sendMail(mailOptionsToGamanfy, function (err) {
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
    // const url = req.protocol + '://' + req.get('host')
    const { company, userId, offerId } = req.params;
    const { recommendedEmail, recommendedFirstName, recommendedLastName, recommendedPhoneNumber,
      recommendedLinkedin, howFoundCandidate, candidateEducation, lastJob, age, language, candidateLocation, experiences, similarExp,
      ownDescription, motivations, whyFits,
      availability, moneyExpec, currentSituation, otherAspects } = req.body;


    const theOffer = await Offers.findById(offerId);
    const influencerUserId = await InfluencerUser.findById(userId).populate('recommendedPeople companyUser');
    const recommendedBy = influencerUserId.email;
    const companyUserMoneyPerRec = influencerUserId.companyUser.companyUserPunctuation;
    const influencerUserName = `${influencerUserId.firstName} ${influencerUserId.lastName}`;
    const companyId = await Company.findById(company)
    const theCompany = companyId.companyName;
    const minGrossSalary = theOffer.retribution.minGrossSalary;
    const maxGrossSalary = theOffer.retribution.maxGrossSalary;
    const jobName = theOffer.jobOfferData.jobName
    const mainMission = theOffer.jobDescription.mainMission
    let curriculum;

    if (req.file !== undefined) {
      curriculum = req.file.path
    } else {
      curriculum = 'No curriculum provided';
    }

    let recommendedPeople;
    let historicRecommendations;
    let recommendedTimes;


    recommendedPeople = await Recommended.create({
      recommendedEmail, recommendedFirstName, recommendedLastName, offerId: theOffer, recommendedPhoneNumber,
      recommendedLinkedin, howFoundCandidate,
      // curriculum:url + '/public/uploads/' + curriculum,
      curriculum: curriculum,
      candidateInfo: {
        candidateEducation, language, candidateLocation, experiences, similarExp, lastJob, age, ownDescription, motivations, whyFits,
        availability, moneyExpec, currentSituation, otherAspects
      },
      moneyForRec: companyUserMoneyPerRec,
      recommendedBy,
      influencerUserName,
      recommendedByInfluencerPro: true

    });

    recommendedTimes = await Offers.findByIdAndUpdate(theOffer, {
      $push: { recommendedTimes: recommendedPeople }
    }, { new: true })

    historicRecommendations = recommendedPeople

    let companyUser = await CompanyUser.findByIdAndUpdate(influencerUserId.companyUser, { $inc: { 'companyUserPunctuation': 20 } }, { new: true })
    const updatedUser = await InfluencerUser.findByIdAndUpdate(influencerUserId, { $push: { recommendedPeople: recommendedPeople._id, historicRecommendations: historicRecommendations._id }, companyUser }, { new: true })

    let transporter = nodemailer.createTransport({

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
      
      <div style='width:25em; height:63.5em;'>
      <p style='font-weight:600; color:#535353; font-size:18px; text-align:center; height:2em'> ¡Hola ${recommendedFirstName}! <b>${influencerUserName}</b>  te ha recomendado <br/> para una oferta de trabajo en Gamanfy. </p>\n
      <img  src="cid:naranjaabstract@naranja.com" style='height:6em; display:inline-block'/>
      <div style='font-weight:300; color:#535353; font-size:14px ; width:33em; height:28em'>
      <b>Puesto:</b> ${jobName}<br/>
      <b>Empresa:</b> ${theCompany}<br/> 
      <b>Salario base:</b> ${minGrossSalary}-${maxGrossSalary}<br/>
      
     
      
      <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
      <p> Si quieres ver la oferta completa haz clic en este botón y podrás inscribirte a la oferta de manera sencilla.</p>
          <button type='submit' style="border:none; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; height:3em; margin-top:2em; margin-left:9em"><a href='${process.env.PUBLIC_DOMAIN}/offer-details-accept-rec/${theOffer._id}/${recommendedPeople._id}' style='color:white; text-decoration:none; font-weight:500'>Ver detalles de la oferta</a></button><br/>
          
          <p>¿Cómo funciona el proceso de selección Gamanfy?</p>

          <p>Es muy sencillo:</p>
          <ol>
      <li>Examina con atención la oferta de trabajo.</li>
      <li>Si estas interesado/a haz clic en el botón que encontraras debajo de la oferta de trabajo “Aceptar Recomendación y Registrarse”</li>
      <li>Ya está todo hecho. Si tu perfil se ajusta a la oferta de trabajo recibirás un e-mail para realizar una primera entrevista.</li>
      </ol>
      
      <p>¿No estas interesado?</p>
      <p style='color:#535353; font-weight:300; font-size:14px; margin-left:1.5em; margin-top:4em'>¿No estas interesado ? Haz click <a href='${process.env.PUBLIC_DOMAIN}/recommend/user/reject-rec/${recommendedPeople._id}/${theOffer._id}' style='color:#535353; font-weight:600'>aquí</a> para indicar que no quieres</br> participar en la oferta</p>\n
      <p style='tex-align:center'><b>Tu también puedes transfórmate en un influencer de talento</b><p>
      <p>Gamanfy es la primera plataforma que te permite recomendar a tus mejores contactos para una oferta de trabajo y cobrar por ello. </p>
      <p>Para mas información, visita nuestra pagina https://gamanfy.com/influencers</p>
      <p>Saludos, <br/> el Equipo de Gamanfy<p>

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

    let mailOptionsToGamanfy = {
      from: process.env.HOST_MAIL,
      to: 'hello@gamanfy.com',
      subject: 'Gamanfy, Recomendaciones',
      html: `
      ${influencerUserName} con email ${recommendedBy} ha hecho una nueva recomendación para la oferta ${jobName}.
      Nombre del candidato: ${recommendedFirstName},\n
      Email del candidato: ${recommendedEmail},

      ID Empresa: ${company}
      ID Influencer: ${influencerUserId._id}
      ID Oferta: ${offerId}

      `
    }

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });
    transporter.sendMail(mailOptionsToGamanfy, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
      }
    });

    res.status(200).send({ updatedUser })


  } catch (error) {
    console.log(error)
    res.status(400).json({ error: 'An error occurred while sending recommendation' })
  }
};


exports.candidatesInProcess = async (req, res) => {

  try {
    const { offerId } = req.params;

    let recommendations = await Recommended.find({

      $and: [
        { "offerId": offerId }, { 'inProcess': true }
      ]
    })
      .populate('offerId')

    res.status(200).json(recommendations)

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while retrieving inProcess info' })
  }
};

exports.validateCandidate = async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;
    await Recommended.findByIdAndUpdate(recommendationId, { recommendationValidated: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id;
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': mongoose.Types.ObjectId(offerIdent) }, { $set: { 'recommendedTimes.$.recommendationValidated': true } }, { new: true })
      .populate("companyThatOffersJob");
    console.log(updatedOffer.companyThatOffersJob.email)

    //email sender
    let transporter = nodemailer.createTransport({

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
      to: updatedOffer.companyThatOffersJob.email,
      subject: 'Notificación de candidato Validado',
      html: `
      <img style='height:auto; width:auto' src="cid:unique2@nodemailer.com"/>
      
      <div style='width:80%'>
        Hola ${updatedOffer.companyThatOffersJob.companyName},<br/>

        Un influencer Gamanfy ha recomendado una persona para el puesto de trabajo ${updatedOffer.jobOfferData.jobName}. <br/>

        Accede directamente a la recomendación desde nuestra plataforma https://app.gamanfy.com en la sección "Mis procesos de selección", <br/>
        o haz click en el enlace: ${process.env.PUBLIC_DOMAIN}/company/${updatedOffer.companyThatOffersJob._id}/${updatedOffer._id}. <br/>
        Si tienes cualquier pregunta no dudes en ponerte en contacto con nosotros, <br/>
        Un saludo, el equipo Gamanfy.

        <div>
        <img  src="cid:abstract2@nodemailer.com"  width=150 height=120  style='height:9em; display:inline-block'/>
        
        `,
      attachments: [
        {
          filename: 'abstract-background_25-01.png',
          path: 'public/abstract-background_25-01.png',
          cid: 'abstract2@nodemailer.com'
        },
        {
          filename: 'Anotación 2020-07-30 172748.png',
          path: 'public/Anotación 2020-07-30 172748.png',
          cid: 'unique2@nodemailer.com'
        }
      ]
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else { res.status(200).json({ updatedOffer }) }
    });

  } catch (error) {
    res.json({ error: 'An error occurred while updating' });
  }
};


exports.candidateAcceptRec = async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { recommendationAccepted: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': mongoose.Types.ObjectId(offerIdent) }, { $set: { 'recommendedTimes.$.recommendationAccepted': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
};

exports.setCandidateInProcess = async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { inProcess: true }, { new: true });
    console.log(updatedRec.recommendedBy)
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': mongoose.Types.ObjectId(offerIdent) }, { $set: { 'recommendedTimes.$.inProcess': true } }, { new: true })
      .populate("companyThatOffersJob");

    let transporter = nodemailer.createTransport({
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



    let mailOptionsToGamanfy = {
      from: process.env.HOST_MAIL,
      to: 'gamanfy@gmail.com',
      subject: 'Gamanfy, Proceso de Selección',
      html: `
      <img style='height:auto; width:auto' <img src="cid:unique5@nodemailer.com"/>
      <div>
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> 
      La empresa ${updatedOffer.companyThatOffersJob.companyName} ha cambiado la recomendación  con indentificación: ${recommendationId} a en proceso. <br/>
      Nombre del proceso: ${updatedOffer.jobOfferData.jobName} <br/>
      Email del candidato : ${updatedRec.recommendedEmail}, <br/>
      Email del influencer : ${updatedRec.recommendedBy} <br/>,
      Email empresa: ${updatedOffer.companyThatOffersJob.email}, <br/>
      
      </p>
      
      </div>
      `,
      attachments: [{
        filename: 'Anotación 2020-07-30 172748.png',
        path: 'public/Anotación 2020-07-30 172748.png',
        cid: 'unique5@nodemailer.com'
      }]
    }

    let mailOptionsToInfluencer = { 
      from: process.env.HOST_MAIL,
      to: updatedRec.recommendedBy,
      subject: 'Gamanfy, Proceso de Selección',
      html: `
      <img style='height:auto; width:auto' <img src="cid:unique4@nodemailer.com"/>
      <div>
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> 
        Hola ${updatedRec.influencerUserName}, <br/>

        Le informamos que la empresa ${updatedOffer.companyThatOffersJob.companyName} está interesada en la candidatura de ${updatedRec.recommendedFirstName} ${updatedRec.recommendedLastName}. 
        En Breve le contactaremos para realizar una primera entrevista.

        Si tiene cualquier pregunta no dudes en ponerte en contacto con nosotros.

        Un saludo, el equipo de Gamanfy
        </p> 
      </div>
      `,
      attachments: [{
        filename: 'Anotación 2020-07-30 172748.png',
        path: 'public/Anotación 2020-07-30 172748.png',
        cid: 'unique4@nodemailer.com'
      }]
    }

    let mailOptionsToCandidate = {
      from: process.env.HOST_MAIL,
      to: updatedRec.recommendedEmail,
      subject: 'Gamanfy, Informe de candidato',
      html: `
      <img style='height:auto; width:auto' <img src="cid:unique3@nodemailer.com"/>
      <div>
     
      <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> 
        Hola ${updatedRec.recommendedFirstName}, <br/>

        ${updatedOffer.companyThatOffersJob.companyName} ha pasado tu candidatura para ${updatedOffer.jobOfferData.jobName} a "En proceso". <br/>

        En breve nos pondremos en contacto contigo para realizar una primera entrevista por video diferido. <br/>

        Si tienes cualquier pregunta no dudes en ponerte en contacto con nosotros. <br/>

        Un saludo, el equipo de Gamanfy
      </p>
      
      </div>
      `,
      attachments: [{
        filename: 'Anotación 2020-07-30 172748.png',
        path: 'public/Anotación 2020-07-30 172748.png',
        cid: 'unique3@nodemailer.com'
      }]
    };

    transporter.sendMail(mailOptionsToGamanfy, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); } else {
        res.status(200)
      }
    });
    transporter.sendMail(mailOptionsToInfluencer, function (err) {

      if (err) { return res.status(500).json({ msg: err.message }); } else {
        res.status(200)
      }
    });
    transporter.sendMail(mailOptionsToCandidate, function (err) {
      if (err) { return res.status(500).json({ msg: err.message }); } else {
        res.status(200).json(updatedOffer)
      }
    });
    

  } catch (error) {
    console.log(error)
    res.status(400).json({ error: 'An error occurred while updating' })
  }
};

exports.setCandidateHired = async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { hired: true, stillInProcess: false, inProcess: true, recommendationAccepted: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': mongoose.Types.ObjectId(offerIdent) }, { $set: { 'recommendedTimes.$.hired': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
};

