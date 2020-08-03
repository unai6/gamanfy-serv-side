const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const crypto = require('crypto');
const Offers = require('../../models/JobOffer.js');
const Contract = require('../../models/Contract');
const Category = require('../../models/Category');
const KillerQ = require('../../models/KillerQ');
const Company = require('../../models/Company');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');
const Recommended = require('../../models/Recommended');
const InfluencerUser = require("../../models/InfluencerUser.js");
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');



router.get('/dashboard', async (req, res, next) => {

    try {
        await Offers.find({ "contractServices.hasSourcingWithInfluencer": true }).populate([{
            path: 'addressId contractId sectorId',
        }]).exec(function (err, offerIdPopulated) {
            offerIdPopulated.length !== 0
                ? res.json({ offers: offerIdPopulated })
                : res.json({ message: "No products found!" });
        })



    } catch (error) {
        res.status(404).json({ error: 'An error occurred while bringing offers' });
    }
});

router.get('/offer-details/:offerId', async (req, res) => {
    try {

        let { offerId } = req.params;

        let offer = await Offers.findById(offerId).populate('addressId sectorId contractId')
        res.status(200).json({ offer })

    } catch (error) {
        res.status(400).json('An error occurred while showing offer details')
    }
})

router.get('/candidates/:offerId/:companyId', async (req, res) => {
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
})

router.post('/candidates/reject-candidate/:offerId/:companyId/:recommendationId', async (req, res) => {
    try {

        const { offerId, companyId, recommendationId } = req.params;
      
            let updatedOffer = await Offers.findByIdAndUpdate(offerId, { $pull: { "recommendedTimes": { _id: mongoose.Types.ObjectId(recommendationId) } } }, {new:true})       
            await Recommended.findByIdAndUpdate(recommendationId, {recommendationRejected :true, recommendationAccepted:false, inProcess:false, stillInProcess:false})
            res.json(updatedOffer)

            await Company.findById(companyId)
          
    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
})


router.get('/getData/:companyId', async (req, res) => {

    try {
        const { companyId } = req.params;

        await Company.findById(companyId)
            .populate([

                {
                    path: 'postedOffers',
                    populate: {
                        path: 'addressId sectorId contractId'
                    }

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
            ]

            ).exec(function (err, offerIdPopulated) {
                if (err) {
                    console.log(err)
                } else {
                    res.status(200).json({ user: offerIdPopulated })
                }
            })
    } catch (error) {
        res.status(400).json({ mssg: 'error' })
    }

})

router.post('/:companyId/post-job-offer', async (req, res, next) => {

    try {
        const { companyId } = req.params;
        //scorepunc
        const { scorePerRec, moneyPerRec } = req.body;
        //contract services
        const { hasSourcingWithInfluencer, hasExclusiveHeadHunter } = req.body;
        //additional services
        const { hasPersonalityTest, hasVideoInterview, hasKitOnBoardingGamanfy } = req.body;
        //gamanfy fee plus additional services
        const { totalFee } = req.body;
        //company data 
        let { processNum, description, website, recruiter, companyName } = req.body;
        processNum = crypto.randomBytes(2).toString('hex')
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
            scorePerRec,
            moneyPerRec,
            contractServices: { hasSourcingWithInfluencer, hasExclusiveHeadHunter },
            additionalServices: { hasPersonalityTest, hasVideoInterview, hasKitOnBoardingGamanfy },
            gamanfyFee: { totalFee },
            companyData: { processNum, description, website, recruiter, companyName: company.companyName, companyId: company._id },
            jobOfferData: {
                jobName, onDate, offDate, processState, isRemote, personsOnCharge
            },
            benefits: [benefits],
            jobDescription: { mainMission, team, jobDescription },
            showMoney: showMoney,
            manager: { managerDescription, managerLinkedin },
            addressId, sectorId, categoryId, contractId,
            retribution: { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney },
            minRequirements: { minExp, minStudies, minReqDescription, language },
            keyKnowledge: { keyKnowledge },
            keyCompetences: { keyComp },
            videoInterviewQuestions: { question1, question2, question3, question4, question5 }
        });
        let updatedCompany = await Company.findByIdAndUpdate(company, { $push: { postedOffers: postedOffers._id } }, { new: true })
        res.status(200).json({ updatedCompany });

    } catch (error) {
        res.status(400).json('An error occurred while saving offer data')
    }

});


router.put('/:companyId/:offerId/edit-offer', async (req, res) => {


    try {

        let { companyId, offerId } = req.params;
        //scorepunc
        const { scorePerRec, moneyPerRec, sector, category, contract } = req.body;

        //contract services
        const { hasSourcingWithInfluencer, hasExclusiveHeadHunter } = req.body;

        //additional services
        const { hasPersonalityTest, hasVideoInterview, hasKitOnBoardingGamanfy } = req.body;

        //gamanfy fee plus additional services
        const { totalFee } = req.body;

        //company data 
        const { processNum, description, website, recruiter } = req.body;

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
                contractServices: { hasSourcingWithInfluencer, hasExclusiveHeadHunter },
                additionalServices: { hasPersonalityTest, hasVideoInterview, hasKitOnBoardingGamanfy },
                gamanfyFee: { totalFee },
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
                videoInterviewQuestions: { question1, question2, question3, question4, question5 },
                scorePerRec, moneyPerRec, addressId, sectorId, categoryId, contractId
            },
        }, { new: true });

        let updatedCompany = Company.findByIdAndUpdate(myCompany._id, { updatedOffer }, { new: true })

        res.status(200).json({ updatedOffer });

    } catch (error) {
        res.status(400).json({ error: 'An error occurred while retrieving offers' })
    };
});


router.post('/:companyId/:offerId/delete-offer', async (req, res) => {
    try {
        const { companyId, offerId } = req.params;
        await Company.findByIdAndUpdate(companyId, { $pull: { postedOffers: { $in: [offerId] } } }, { multi: true });
        await Offers.findByIdAndRemove(offerId);
        await Recommended.deleteOne({ offerId: offerId });
        await InfluencerUser.findOneAndUpdate({}, { $pull: { recommendedPeople: { $in: [offerId] } } }, { new: true });
        res.status(200).json({ message: 'offer deleted succesfully' });

    } catch (error) {
        res.status(400).json({ message: 'An error occurred while trying to delete the offer' });
    }

})

router.post('/company/infoRequest/:offerId/:companyId/:recommendationId', async (req, res) => {
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
            to: company.email,
            subject: 'Gamanfy, Informe de candidato',
            html: `
           <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
            <div>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${company.companyName}!, como se ha requerido, <br/> te adjuntamos el informe del candidato. </p>\n
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'>Saludos,</p>\n
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> Gamanfy Staff.</p>\n
            <div style='font-weight:300; color:#535353; font-size:14px'>
    
            </div>
              <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
              <button type='submit' style="border:none; background:rgb(255,188,73); border-radius:5px; width:14em; height:2.5em; margin-top:2em; margin-left:11em"><a href=${process.env.PUBLIC_DOMAIN}/${recommendationId}/candidate-info style='color:white; text-decoration:none; font-weight:500'>Ver informe del candidato</a></button><br/>
              </div>
          
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
                res.status(200)
            }
        });

        res.status(200).json({ 'recommendation': recommendation, 'company': company, 'populatedRec': recommendToPopulate })

    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }

});

router.post('/:recommendationId/candidate-info', async (req, res) => {

    try {

        let { recommendationId } = req.params;

        let recommendation = await Recommended.findById(recommendationId);

        res.status(200).json(recommendation)
    } catch (error) {
        res.status(400).json({ error: 'Error' })
    }
});

module.exports = router