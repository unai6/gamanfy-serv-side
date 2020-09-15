const express = require("express");
const router = express.Router();

const userController = require('../../appControllers/userControllers/recommendations');
const companyController = require('../../appControllers/companyControllers/recommend');
const uploader = require('../../config/uploadsForPDF');

router.get('/:userId/dashboard', userController.getUserRecommendationsDashboard)
router.post('/influencerUser/:idCompany/:idUser/:idOffer', userController.influencerUserRecommendation)
router.post('/companyUser/:userId/:offerId/:company', uploader.single('curriculum'), userController.companyUserRecommendation);
router.post('/user/delete-recommendation/:userId/:recommendationId/:offerId', userController.deleteRecommendation);
router.post('/:companyId', companyController.recommend);
router.post('/user/reject-rec/:recommendationId/:offerId', userController.rejectRecommendation);
router.get('/:offerId/inProcess', userController.candidatesInProcess);
router.post('/admin-validate-candidate/updateCandidateProcess/:offerId/:recommendationId', userController.validateCandidate);
router.post('/candidate-interview/updateCandidateProcess/:offerId/:recommendationId', userController.setCandidateInProcess);
router.post('/updateCandidateProcess/candidate-hired/:offerId/:recommendationId', userController.setCandidateHired);
router.post('/candidate-accept-recommendation/updateCandidateProcess/:offerId/:recommendationId', userController.candidateAcceptRec);




module.exports = router