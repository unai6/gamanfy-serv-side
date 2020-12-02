const express = require("express");
const router = express.Router();

const {recommendations} = require('../../appControllers')
const companyController = require('../../appControllers/companyControllers/recommend');
const uploader = require('../../config/uploadsForPDF');

router.get('/:userId/dashboard', recommendations.getUserRecommendationsDashboard)
router.get('/:offerId/inProcess', recommendations.candidatesInProcess);
router.post('/influencerUser/:idCompany/:idUser/:idOffer', recommendations.influencerUserRecommendation)
router.post('/companyUser/:userId/:offerId/:company', uploader.single('curriculum'), recommendations.companyUserRecommendation);
router.post('/user/delete-recommendation/:userId/:recommendationId/:offerId', recommendations.deleteRecommendation);
router.post('/:companyId', companyController.recommend);
router.post('/user/reject-rec/:recommendationId/:offerId', recommendations.rejectRecommendation);
router.post('/admin-validate-candidate/updateCandidateProcess/:offerId/:recommendationId', recommendations.validateCandidate);
router.post('/candidate-interview/updateCandidateProcess/:offerId/:recommendationId', recommendations.setCandidateInProcess);
router.post('/updateCandidateProcess/candidate-hired/:offerId/:recommendationId', recommendations.setCandidateHired);
router.post('/candidate-accept-recommendation/updateCandidateProcess/:offerId/:recommendationId', recommendations.candidateAcceptRec);




module.exports = router