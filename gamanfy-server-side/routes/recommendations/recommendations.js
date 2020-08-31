const express = require("express");
const router = express.Router();

const getUserRecommendationsDashboard = require('../../appControllers/userControllers/recommendations');
const companySendRecommendation = require('../../appControllers/companyControllers/recommend');
const deleteRecommendations = require('../../appControllers/userControllers/recommendations');
const companyUserSendRecommendation = require('../../appControllers/userControllers/recommendations');
const influencerUserSendRecommendation = require('../../appControllers/userControllers/recommendations');
const rejectRecommendation = require('../../appControllers/userControllers/recommendations');
const candidatesInProcess = require('../../appControllers/userControllers/recommendations');
const validateCandidate = require('../../appControllers/userControllers/recommendations');
const candidateAcceptRec = require('../../appControllers/userControllers/recommendations');
const setCandidateInProcess = require('../../appControllers/userControllers/recommendations');
const setCandidateHired = require('../../appControllers/userControllers/recommendations');
const uploader = require('../../config/uploadsForPDF');

router.get('/:userId/dashboard', getUserRecommendationsDashboard.getUserRecommendationsDashboard)
router.post('/influencerUser/:idCompany/:idUser/:idOffer', influencerUserSendRecommendation.influencerUserRecommendation)
router.post('/companyUser/:userId/:offerId/:company', uploader.single('curriculum'), companyUserSendRecommendation.companyUserRecommendation);
router.post('/user/delete-recommendation/:userId/:recommendationId/:offerId', deleteRecommendations.deleteRecommendation);
router.post('/:companyId', companySendRecommendation.recommend);
router.post('/user/reject-rec/:recommendationId/:offerId', rejectRecommendation.rejectRecommendation);
router.get('/:offerId/inProcess', candidatesInProcess.candidatesInProcess);
router.post('/admin-validate-candidate/updateCandidateProcess/:offerId/:recommendationId', validateCandidate.validateCandidate);
router.post('/candidate-interview/updateCandidateProcess/:offerId/:recommendationId', setCandidateInProcess.setCandidateInProcess);
router.post('/updateCandidateProcess/candidate-hired/:offerId/:recommendationId', setCandidateHired.setCandidateHired);
router.post('/candidate-accept-recommendation/updateCandidateProcess/:offerId/:recommendationId', candidateAcceptRec.candidateAcceptRec);




module.exports = router