const Company = require('../../models/Company');
const Recommended = require('../../models/Recommended');


exports.recommend = async (req, res, next) => {

    try {
        const { recommendedEmail, recommendedFirstName, recommendedLastName, whyRec } = req.body;
        const { companyId } = req.params;
        await Company.findById(companyId);
        let recommendedProfessionals = await Recommended.create({ recommendedEmail, recommendedFirstName, recommendedLastName, whyRec  })

        const updatedUser = await Company.findByIdAndUpdate(companyId, { $push: { recommendedProfessionals: recommendedProfessionals._id } }, { new: true })
        res.status(200).json({ updatedUser })
    } catch (error) {
        res.status(400).json({ error: 'An error occurred while recommending user' })
    }
}