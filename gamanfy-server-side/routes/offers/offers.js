const express = require("express");
const router = express.Router();

const picUploader = require('../../config/picsUploader');
const offersController = require('../../appControllers/offersController.js');

router.get('/dashboard', offersController.offersDashboard);
router.get('/offer-details/:offerId', offersController.offerDetails);
router.get('/candidates/:offerId/:companyId', offersController.candidatesInOffer);
router.post('/candidates/reject-candidate/:offerId/:companyId/:recommendationId', offersController.companyRejectCandidate);
router.get('/getData/:companyId', offersController.getCompanyData)
router.post('/:companyId/post-job-offer', picUploader.single('offerPicture'), offersController.postJobOffer);
router.put('/:companyId/:offerId/edit-offer', offersController.editJobOffer);
router.post('/:companyId/:offerId/delete-offer', offersController.deleteJobOffer);
router.post('/company/infoRequest/:offerId/:companyId/:recommendationId', offersController.requestCandidateInfo);
router.post('/:recommendationId/candidate-info', offersController.candidateInfo);

module.exports = router