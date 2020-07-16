const InfluencerUser = require('../../models/InfluencerUser');

exports.deleteRecommendation =  async (req, res) => {
  const { userId, recommendationId } = req.params;
  try {

    await InfluencerUser.findByIdAndUpdate(userId, { $pull: { recommendedPeople: {$in : [recommendationId]}  } }, { multi:true });
    res.status(200).json({message:'offer deleted successfully'})

  } catch (error) {
    res.status(400).json({ error: 'An error occurred while deleting recommendation' })
  }
};