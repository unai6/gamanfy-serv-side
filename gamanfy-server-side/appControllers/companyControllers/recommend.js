const Company = require('../../models/Company');
const Recommended = require('../../models/Recommended');


exports.recommend = async (req, res, next) => {

    try {
        const { recommendedEmail, recommendedFirstName, curriculum, recommendedLinkedin, recommendedPhoneNumber, recommendedLastName, whyRec, 
            specificEducation, howMet, sectorBestFit, departmentBestFit, competences, language, candidateLocation, otherAspects } = req.body;
        const { companyId } = req.params;
        await Company.findById(companyId);
        let recommendedProfessionals = await Recommended.create({ recommendedEmail, recommendedFirstName, curriculum, recommendedLinkedin, 
            recommendedPhoneNumber, recommendedLastName, whyRec,
            candidateInfo:{
            specificEducation, howMet, sectorBestFit, departmentBestFit, competences, language, candidateLocation, otherAspects} 
        });

        const updatedUser = await Company.findByIdAndUpdate(companyId, { $push: { recommendedProfessionals: recommendedProfessionals._id } }, { new: true })
        res.status(200).json({ updatedUser })
    } catch (error) {
        res.status(400).json({ error: 'An error occurred while recommending user' })
    }
}