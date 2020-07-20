const InfluencerUser = require('../../models/InfluencerUser');
const Recommended = require('../../models/Recommended');
const Offers = require('../../models/JobOffer');
const mongoose = require("mongoose");

exports.deleteRecommendation =  async (req, res) => {
  const { userId, recommendationId, offerId} = req.params;
  try {
    let recInsideOffer = await Offers.findById(offerId, { _id: 0, recommendedTimes: { $elemMatch: { _id: mongoose.Types.ObjectId(recommendationId) } } })
    let offerIdent = recInsideOffer.recommendedTimes[0]._id
    await Recommended.deleteOne({_id:recommendationId});
    await Offers.findOneAndUpdate({ 'recommendedTimes._id': offerIdent }, { $pull: { recommendedTimes: { $in: [recommendationId] }} }, { multi:true})
    await InfluencerUser.findByIdAndUpdate(userId, { $pull: { recommendedPeople: {$in : [recommendationId]}  } }, { multi:true });
    
    res.status(200).json({message:'offer deleted successfully'})

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while deleting recommendation' })
  }
};