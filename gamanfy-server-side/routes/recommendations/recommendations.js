const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Offers = require('../../models/JobOffer.js');
const Recommended = require('../../models/Recommended');


const getUserRecommendationsDashboard = require('../../appControllers/userControllers/recommendations');
const companySendRecommendation = require('../../appControllers/companyControllers/recommend');
const deleteRecommendations = require('../../appControllers/userControllers/recommendations');
const companyUserSendRecommendation = require('../../appControllers/userControllers/recommendations');
const influencerUserSendRecommendation = require('../../appControllers/userControllers/recommendations');

router.get('/:userId/dashboard', getUserRecommendationsDashboard.getUserRecommendationsDashboard)
router.post('/influencerUser/:idCompany/:idUser/:idOffer', influencerUserSendRecommendation.influencerUserRecommendation)
router.post('/companyUser/:userId/:offerId/:company', companyUserSendRecommendation.companyUserRecommendation);
router.post('/user/delete-recommendation/:userId/:recommendationId/:offerId', deleteRecommendations.deleteRecommendation);
router.post('/:companyId', companySendRecommendation.recommend);


router.post('/user/reject-rec/:recommendationId/:offerId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;
    
    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { recommendationAccepted:false, recommendationRejected:true }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes': updatedRec } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
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

router.post('/updateCandidateProcess/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;

    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, {  inProcess:true}, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes': updatedRec } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});


router.post('/updateProcesses/updateRecommendations/:offerId/:recommendationId', async (req, res) => {

  try {
    const { offerId, recommendationId } = req.params;
    
    let updatedRec = await Recommended.findByIdAndUpdate(recommendationId, { hired:true, stillInProcess: false  }, { new: true })
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    let updatedOffer = await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $set: { 'recommendedTimes': updatedRec } }, { new: true })
    res.status(200).json(updatedOffer)
  } catch (error) {
    res.status(400).json({ error: 'An error occurred while updating' })
  }
});





module.exports = router