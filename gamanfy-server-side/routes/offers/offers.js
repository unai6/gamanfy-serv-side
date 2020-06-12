const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const Offers = require('../../models/JobOffer.js');
const Contract = require('../../models/Contract');
const Category = require('../../models/Category');
const KillerQ = require('../../models/KillerQ');
const Company = require('../../models/Company');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');




router.get('/dashboard', async (req, res, next) => {

    try {
        const allOffers = await Offers.find();
        allOffers.length !== 0
            ? res.json({ allOffers })
            : res.json({ message: "No products found!" });

    } catch (error) {
        res.status(404).json({ error: 'An error occurred while bringing offers' });
    }
});

router.post('/:companyId/post-job-offer', async (req, res, next) => {

    try {
        const { companyId } = req.params;
        //scorepunc
        const { scorePerRec, moneyPerRec } = req.body;

        //contract services
        const { hasSourcingWithInfluencer, hasExclusiveHeadHunter } = req.body;

        //additional services
        const { hasPersonalityTest, hasVideoInterview, hasKitOnBoardgingGamanfy } = req.body;

        //gamanfy fee plus additional services
        const { totalFee, sourcingWithInfluencer, exclusiveHeadHunter, personalityTest, videoInterview, kitOnBoardgingGamanfy } = req.body;

        //company data 
        const { processNum, description, website, recruiter } = req.body;

        //job offer data
        const { jobName, onDate, offDate, processState, isRemote, personsOnCharge, team } = req.body;
        //job description
        const { mainMission, jobDescription } = req.body;
        //manager
        const { managerDescription, managerName } = req.body;

        //job address
        const { countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer } = req.body;

        //category
        const { employee, specialist, intermediateResp, direction, directiveCouncil, cofounder } = req.body;

        //contract
        const { autonomo, contratoDeDuraciónDeterminada, deRelevo, fijoDiscontinuo, formativo, Indefinido, aTiempoParcial, otrosContratos } = req.body;

        //retribution
        const { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney } = req.body;
        // min requirements
        const { minExp, minStudies, keyKnowledge, keyCompetences, minReqDescription, Language, LangugageLevel } = req.body;
        //interview Questions
        const { question1, question2, question3, question4, question5 } = req.body;


        const company = await Company.findById(companyId)
        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer });
        let sectorId = await Sector.create(req.body);
        let categoryId = await Category.create(req.body);
        let contractId = await Contract.create(req.body);
        let postedOffers = await Offers.create({
            scorePerRec,
            moneyPerRec,
            contractServices: { hasSourcingWithInfluencer, hasExclusiveHeadHunter },
            additionalServices: { hasPersonalityTest, hasVideoInterview, hasKitOnBoardgingGamanfy },
            gamanfyFee: { totalFee, sourcingWithInfluencer, exclusiveHeadHunter, personalityTest, videoInterview, kitOnBoardgingGamanfy },
            companyData: { processNum, description, website, recruiter },
            jobOfferData: {
                jobName, onDate, offDate, processState, isRemote, personsOnCharge, team, mainMission, jobDescription,
                managerDescription, managerName,
            },
            addressId, sectorId, categoryId, contractId,
            retribution: { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney },
            minRequirements: { minExp, minStudies, keyKnowledge, keyCompetences, minReqDescription, Language, LangugageLevel },
            videoInterviewQuestions: { question1, question2, question3, question4, question5 }
        });
        let updatedCompany = await Company.findByIdAndUpdate(company, { $push: { postedOffers: postedOffers._id } }, { new: true })
        req.session.currentUser = updatedCompany;
        res.status(200).json({ updatedCompany });

    } catch (error) {
        res.status(400).json('An error occurred while saving offer data')
    }

});


module.exports = router