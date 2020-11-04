const mongoose = require("mongoose");
const crypto = require('crypto');
const Offers = require('../models/JobOffer.js');
const Contract = require('../models/Contract');
const Category = require('../models/Category');
const KillerQ = require('../models/KillerQ');
const Company = require('../models/Company');
const Sector = require('../models/Sector');
const Address = require('../models/Address');
const Recommended = require('../models/Recommended');
const InfluencerUser = require("../models/InfluencerUser.js");
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

exports.offersDashboard = async (req, res, next) => {

    try {
        let offerId = await Offers.find().sort({ "createdAt": -1 }).populate([{
            path: 'addressId contractId sectorId',
        }]).exec(function (err, offerIdPopulated) {

            offerIdPopulated.length > 0
                ? res.json({ offers: offerIdPopulated })
                : res.json({ message: "No products found!" });
        })
        // { "contractServices.hasSourcingWithInfluencer": true }

        console.log(offerId)



    } catch (error) {
        res.status(404).json({ error: 'An error occurred while bringing offers' });
    }
};

exports.offerDetails = async (req, res) => {
    try {

        let { offerId } = req.params;

        let offer = await Offers.findById(offerId).populate('addressId sectorId contractId')
        res.status(200).json({ offer })

    } catch (error) {
        res.status(400).json('An error occurred while showing offer details')
    }
};

exports.candidatesInOffer = async (req, res) => {
    try {

        let { offerId, companyId } = req.params;
        await Offers.findById(offerId).populate({

            path: 'jobOffers.recommendedTimes',
            model: 'JobOffer'

        }).exec(function (err, recommendedTimes) {
            if (err) {
                console.log(err);
            } else {
                res.status(200).json(recommendedTimes.recommendedTimes);
                console.log("success");
            }
        })

        await Company.findById(companyId)

    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
};


exports.companyRejectCandidate = async (req, res) => {
    try {

        const { offerId, companyId, recommendationId } = req.params;

        let updatedOffer = await Offers.findByIdAndUpdate(offerId, { $pull: { "recommendedTimes": { _id: mongoose.Types.ObjectId(recommendationId) } } }, { new: true }).populate("companyThatOffersJob")
        let recommendation = await Recommended.findByIdAndUpdate(recommendationId, { recommendationRejected: true, recommendationAccepted: false, inProcess: false, stillInProcess: false })
        res.json({ 'recommendation': recommendation, 'updatedOffer': updatedOffer });

        await Company.findById(companyId);

        const handlebarOptions = {
            viewEngine: {
                extName: ".hbs",
                defaultLayout: path.resolve(__dirname, "../views/layout.hbs"),
            },
            viewPath: path.resolve(__dirname, "../views"),
            extName: ".hbs",
        };

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

        transporter.use('compile', hbs(handlebarOptions));


        let mailOptionsToInfluencer = {
            from: process.env.HOST_MAIL,
            to: recommendation.recommendedBy,
            subject: 'Gamanfy, Proceso de Selección',
            template:'rejectCandidateForInfluencer',
            context: {
                influencerUserName: recommendation.influencerUserName,
                recommendedFirstName: recommendation.recommendedFirstName,
                recommendedEmail: recommendation.recommendedEmail, 
                companyName: updatedOffer.companyThatOffersJob.companyName, 
                jobName:updatedOffer.jobOfferData.jobName 
            },
            attachments: [{
                filename: 'Anotación 2020-07-30 172748.png',
                path: 'public/Anotación 2020-07-30 172748.png',
                cid: 'unique4@nodemailer.com'
            }]
        }

        let mailOptionsToCandidate = {
            from: process.env.HOST_MAIL,
            to: recommendation.recommendedEmail,
            subject: 'Gamanfy, Informe de candidato',
            template:'rejectCandidateForCandidate',
            context: {
                recommendedFirstName: recommendation.recommendedFirstName, 
                companyName: updatedOffer.companyThatOffersJob.companyName, 
                jobName:updatedOffer.jobOfferData.jobName 
            },
            attachments: [{
                filename: 'Anotación 2020-07-30 172748.png',
                path: 'public/Anotación 2020-07-30 172748.png',
                cid: 'unique3@nodemailer.com'
            }]
        };

        transporter.sendMail(mailOptionsToCandidate, function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); } else {
                res.status(200)
            }
        });
        transporter.sendMail(mailOptionsToInfluencer, function (err) {

            if (err) { return res.status(500).json({ msg: err.message }); } else {
                res.status(200)
            }
        });
   

    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
};

exports.getCompanyData = async (req, res) => {

    try {
        const { companyId } = req.params;

        await Company.findById(companyId)
            .populate([

                {
                    path: 'postedOffers',
                    populate: {
                        path: 'addressId sectorId contractId',
                    },
                    options: { sort: { 'createdAt': -1 } }


                },
                {
                    path: 'addressId',
                    populate: {
                        path: 'addressId'
                    }

                },
                {
                    path: 'sectorId',
                    populate: {
                        path: 'sectorId'
                    }
                },
                {
                    path: 'taxAddress',
                    populate: {
                        path: 'taxAddress'
                    }
                },
            ])
            .exec(function (err, offerIdPopulated) {
                if (err) {
                    console.log(err)
                } else {
                    res.status(200).send({ user: offerIdPopulated })
                }
            })
    } catch (error) {
        res.status(400).json({ mssg: 'error' })
    }

};


exports.postJobOffer = async (req, res, next) => {

    try {

        // const url = req.protocol + '://' + req.get('host');
        const { companyId } = req.params;
        //scorepunc
        const { scorePerRec, moneyPerRec } = req.body;
        //company data 
        let { description, website, recruiter, companyName } = req.body;
        //job offer data
        const { jobName, onDate, offDate, processState, isRemote, personsOnCharge, team } = req.body;
        //job description
        const { mainMission, jobDescription } = req.body;
        //manager
        const { managerDescription, managerLinkedin } = req.body;
        //job address
        const { countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer } = req.body;
        //retribution
        const { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney } = req.body;
        // min requirements
        const { minExp, minStudies, keyKnowledge, keyComp, minReqDescription, language, } = req.body;
        //interview Questions
        const { question1, question2, question3, question4, question5 } = req.body;
        //benfits
        const { benefits } = req.body;
        // const offerPicture = req.file.filename
        const offerPicture = req.file.path
        // console.log(req.file)

        let company = await Company.findById(companyId);


        if (company.description !== '' || null) {
            description = company.description;
        } else if (company.companyName !== '' || null) {
            companyName = company.companyName;
        };

        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer });
        let sectorId = await Sector.create(req.body);
        let categoryId = await Category.create(req.body);
        let contractId = await Contract.create(req.body);
        let postedOffers = await Offers.create({
            knowMore:'',
            scorePerRec,
            moneyPerRec,
            // imgPath: '/public/companyPictures/' + offerPicture,
            offerPicture: offerPicture,
            companyData: { description, website, recruiter, companyName: company.companyName, companyId: company._id },
            jobOfferData: {
                jobName, onDate, offDate, processState: processState, isRemote: isRemote, personsOnCharge
            },
            benefits: [benefits],
            jobDescription: { mainMission, team, jobDescription },
            showMoney: showMoney,
            manager: { managerDescription, managerLinkedin },
            addressId, sectorId, categoryId, contractId,
            retribution: { minGrossSalary, maxGrossSalary, variableRetribution: variableRetribution, quantityVariableRetribution },
            minRequirements: { minExp, minStudies, minReqDescription, language },
            keyKnowledge: { keyKnowledge },
            keyCompetences: { keyComp },
            companyThatOffersJob: company._id
        });
        let updatedCompany = await Company.findByIdAndUpdate(company, { $push: { postedOffers: postedOffers._id } }, { new: true })
        res.status(200).json({ updatedCompany });

    } catch (error) {
        console.log(error)
        res.status(400).json({ mssg: 'An error occurred while saving offer data', 'error': error })
    }

};

exports.editJobOffer = async (req, res) => {

    try {

        let { companyId, offerId } = req.params;
        //scorepunc
        const { scorePerRec, moneyPerRec, sector, category, contract } = req.body;

        //company data 
        const { description, website, recruiter } = req.body;

        //job offer data
        const { jobName, onDate, offDate, processState, isRemote, personsOnCharge, team } = req.body;
        //job description
        const { mainMission, jobDescription } = req.body;
        //manager
        const { managerDescription, managerLinkedin } = req.body;

        //job address
        const { countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer } = req.body;

        //retribution
        const { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney } = req.body;
        // min requirements
        const { minExp, minStudies, keyKnowledge, keyComp, minReqDescription, language, langugageLevel } = req.body;
        //interview Questions
        const { question1, question2, question3, question4, question5 } = req.body;

        let myCompany = await Company.findById(companyId);
        let offerInDB = await Offers.findById(offerId);
        let addressId = await Address.findByIdAndUpdate(myCompany.addressId, { countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer }, { new: true });
        let sectorId = await Sector.findByIdAndUpdate(myCompany.sectorId, { sector }, { new: true });
        let categoryId = await Category.findByIdAndUpdate(myCompany.categoryId, { category }, { new: true });
        let contractId = await Contract.findByIdAndUpdate(myCompany.contractId, { contract }, { new: true });

        let updatedOffer = await Offers.findByIdAndUpdate(offerInDB._id, {
            $set: {
                knowMore,
                companyData: { processNum, description, website, recruiter },
                jobOfferData: {
                    jobName, onDate, offDate, processState, isRemote, personsOnCharge
                },
                jobDescription: { mainMission, team, jobDescription },
                showMoney: { showMoney },
                manager: { managerDescription, managerLinkedin },
                retribution: { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney },
                minRequirements: { minExp, minStudies, minReqDescription, language },
                keyCompetences: { keyComp },
                keyKnowledge: { keyKnowledge },
                scorePerRec, moneyPerRec, addressId, sectorId, categoryId, contractId
            },
        }, { new: true });

        let updatedCompany = Company.findByIdAndUpdate(myCompany._id, { updatedOffer }, { new: true })

        res.status(200).json({ updatedOffer });

    } catch (error) {
        res.status(400).json({ error: 'An error occurred while retrieving offers' })
    };
};

exports.deleteJobOffer = async (req, res) => {
    try {
        const { companyId, offerId } = req.params;
        await Company.findByIdAndUpdate(companyId, { $pull: { postedOffers: { $in: [offerId] } } }, { new: true });
        await Offers.findByIdAndRemove(offerId);
        await Recommended.deleteOne({ offerId: offerId });
        await InfluencerUser.findOneAndUpdate({}, { $pull: { recommendedPeople: { $in: [offerId] } } }, { new: true });
        res.status(200).json({ message: 'offer deleted succesfully' });

    } catch (error) {
        console.log(error)
        res.status(400).json({ message: 'An error occurred while trying to delete the offer' });
    }
};


exports.requestCandidateInfo = async (req, res) => {
    try {

        let { offerId, companyId, recommendationId } = req.params;
        let recommendToPopulate = await Offers.findById(offerId).populate({

            path: 'recommendedTimes.offerId',
            poulate: {
                path: 'offerId',
                populate: {
                    path: 'offerId',
                    model: 'JobOffer'
                }
            }
        });


        let recommendation = await Recommended.findById(recommendationId)

        let company = await Company.findById(companyId)


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
            subject: 'Gamanfy, Informe de candidato',
            html: `
            <img style='height:auto; width:auto' <img src="cid:unique@nodemailer.com"/>
            <div>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> 
            La empresa ${company.companyName} ha requerido un informe del candidato con indentificación de recomendación : ${recommendationId} <br/>
            Email del candidato : ${recommendation.recommendedEmail},<br/>
            Nombre del candidato: ${recommendation.recommendedFirstName},<br/>,
            Email Empresa : ${company.email}, <br/>,
            ID Empresa: ${companyId}
            </p>\n
            
            </div>
            `,
            attachments: [{
                filename: 'Anotación 2020-07-30 172748.png',
                path: 'public/Anotación 2020-07-30 172748.png',
                cid: 'unique@nodemailer.com'
            }]
        }


        let mailOptions = {
            from: process.env.HOST_MAIL,
            to: company.email,
            subject: 'Gamanfy, Informe de candidato',
            html: `
           <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
            <div>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${company.companyName}!, <br/> Aquí tienes el informe del candidato ${recommendation.recommendedFirstName}, tal y como nos has solicitado.</p>\n
            <div style='font-weight:300; color:#535353; font-size:14px'>
    
            </div>
              <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
              <button type='submit' style='border:none; background-color:rgb(255,188,73); border-radius:5px; width:18em; height:2.5em; margin-top:2em; margin-left:9em'><a href=${process.env.PUBLIC_DOMAIN}/${recommendationId}/candidate-info style='color:white; text-decoration:none; font-weight:500'>Ver informe del candidato</a></button><br/>
            
            <p>¿Qué debo hacer a continuación para continuar con el proceso de selección? </p>
            <p><u>Es muy sencillo:</u></p>
            <ol>
            <li>Examina con atención el informe del candidato. ¡Toda la info que necesitas está ahí!</p>
            <li> Si el perfil del candidato se ajusta a tus expectativas, solicítanos una videoentrevista y un test de personalidad</li>
            <li>Ya está todo hecho. En breves los recibirás en tu email y podrás conocer más de cerca al candidato.</li>
            </ol>

            <p>Ahora todo está en tu mano. Si decides contratarlo, recuerda avisarnos por email para que podamos dar la <br/>
            recompensa al Influencer que ha encontrado a ese talento para ti.</p>
            <p>¿El candidato no es lo que esperabas? Recuerda descartarlo del proceso de selección en tu Dashboard</p>
            
            <p>Saludos, <br/> el Equipo de Gamanfy<p>
              </div>
          
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
                res.status(200)
            }
        });

        transporter.sendMail(mailOptionsToGamanfy, function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); } else {
                res.status(200)
            }
        });


        res.status(200).json({ 'recommendation': recommendation, 'company': company, 'populatedRec': recommendToPopulate })

    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
};

exports.candidateInfo = async (req, res) => {

    try {

        let { recommendationId } = req.params;

        let recommendation = await Recommended.findById(recommendationId);

        res.status(200).json(recommendation)
    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
};
