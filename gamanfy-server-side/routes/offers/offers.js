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
        let allOffers = await Offers.find({"contractServices.hasSourcingWithInfluencer" : true}).limit(10);
        allOffers.length !== 0
            ? res.json({ allOffers })
            : res.status(404).json({ message: "No products found!" });

    } catch (error) {
        res.status(404).json({ error: 'An error occurred while bringing offers' });
    }
});

router.get('/getData/:companyId', async (req, res) => {

    try{ const {companyId} = req.params;

    let getCompanyData = await Company.findById(companyId);

    res.status(200).json(getCompanyData);
        
    }catch(error){
        res.status(400).json({mssg: 'error'})
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
        const { totalFee, sourcingWithInfluencer, exclusiveHeadHunter, personalityTest, videoInterview, kitOnBoardgingGamanfy } = req.body;

        //company data 
        let { processNum, description, website, recruiter } = req.body;

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


        const company = await Company.findById(companyId);
        

        if(company.description !== '' || null){
            description = company.description
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

        let myCompany = await Company.findById(companyId);
        let offerInDB = await Offers.findById(offerId);
        let addressId = await Address.findByIdAndUpdate(myCompany.addressId, { countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, cityForOffer }, {new:true});
        let sectorId = await Sector.findByIdAndUpdate(myCompany.sectorId, {sector}, {new:true});
        let categoryId = await Category.findByIdAndUpdate(myCompany.categoryId, {category}, {new:true});
        let contractId = await Contract.findByIdAndUpdate(myCompany.contractId, {contract}, {new:true});

        let updatedOffer = await Offers.findByIdAndUpdate(offerInDB._id, {
            $set: {
                contractServices: { hasSourcingWithInfluencer, hasExclusiveHeadHunter },
                additionalServices: { hasPersonalityTest, hasVideoInterview, hasKitOnBoardingGamanfy },
                gamanfyFee: { totalFee, sourcingWithInfluencer, exclusiveHeadHunter, personalityTest, videoInterview, kitOnBoardgingGamanfy },
                companyData: { processNum, description, website, recruiter },
                jobOfferData: {
                    jobName, onDate, offDate, processState, isRemote, personsOnCharge, team, mainMission, jobDescription,
                    managerDescription, managerName,
                },
                retribution: { minGrossSalary, maxGrossSalary, variableRetribution, quantityVariableRetribution, showMoney },
                minRequirements: { minExp, minStudies, keyKnowledge, keyCompetences, minReqDescription, Language, LangugageLevel },
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
        let updatedCompany = await Company.findByIdAndUpdate(companyId, { $pull : { postedOffers : { $in : [ offerId ] } } }, { multi:true });
        await Offers.findByIdAndRemove(offerId)
        
        req.session.currentUser = updatedCompany;
        res.status(200).json({message:'offer deleted succesfully'});
    
    } catch (error) {
        res.status(400).json({message: 'An error occurred while trying to delete the offer'});
    }


})




module.exports = router