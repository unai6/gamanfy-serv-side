const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');
const multer = require('multer');
const InfluencerUser = require('../../models/InfluencerUser');


const getUserRecommendationsDashboard = require('../../appControllers/userControllers/recommendations');
const companySendRecommendation = require('../../appControllers/companyControllers/recommend');
const deleteRecommendations = require('../../appControllers/userControllers/recommendations');
const companyUserSendRecommendation = require('../../appControllers/userControllers/recommendations');
const influencerUserSendRecommendation = require('../../appControllers/userControllers/recommendations');
const rejectRecommendation = require('../../appControllers/userControllers/recommendations');



router.get('/:userId/dashboard', getUserRecommendationsDashboard.getUserRecommendationsDashboard)
router.post('/influencerUser/:idCompany/:idUser/:idOffer', influencerUserSendRecommendation.influencerUserRecommendation)
router.post('/companyUser/:userId/:offerId/:company', companyUserSendRecommendation.companyUserRecommendation);
router.post('/user/delete-recommendation/:userId/:recommendationId/:offerId', deleteRecommendations.deleteRecommendation);
router.post('/:companyId', companySendRecommendation.recommend);
router.post('/user/reject-rec/:recommendationId/:offerId', rejectRecommendation.rejectRecommendation);


router.post("/uploadPDF/:userId", async (req, res) => {

  try {
    
    if (req.files === null) {
      req.files =''
      return;
    } else{
      const curriculum = req.files.curriculum
      
      curriculum.mv(`public/uploads/${curriculum.name}`, error => {
        if (error) {
          console.log(error);
        }
      })
      
      res.json({ fileName: curriculum.name, filePath: `${__dirname}/uploads/${curriculum.name}/pdf` });
    }
  } catch (error) {
    res.status(400).send(error)
  }

});


router.get('/:offerId/inProcess', async (req, res) => {

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
});

router.post('/admin-validate-candidate/updateCandidateProcess/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { recommendationValidated  : true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes.$.recommendationValidated': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});


router.post('/candidate-accept-recommendation/updateCandidateProcess/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { recommendationAccepted: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': mongoose.Types.ObjectId(offerIdent) }, { $set: {'recommendedTimes.$.recommendationAccepted': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});



router.post('/candidate-interview/updateCandidateProcess/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { inProcess: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'additionalServices.hasVideoInterview': true, 'additionalServices.hasPersonalityTest': true, 'recommendedTimes.$.inProcess': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});


router.post('/updateCandidateProcess/candidate-hired/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { hired: true, stillInProcess: false, inProcess: true, recommendationAccepted: true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes.$.hired': true } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});





module.exports = router