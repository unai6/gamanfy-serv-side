const express = require("express");
const router = express.Router();

const picUploader = require('../../config/picsUploader');
const offersDashboard = require('../../appControllers/offersController.js');
const offerDetails = require('../../appControllers/offersController');
const candidatesInOffer = require('../../appControllers/offersController');
const companyRejectCandidate = require('../../appControllers/offersController');
const getCompanyData = require('../../appControllers/offersController');
const postJobOffer = require('../../appControllers/offersController');
const editJobOffer = require('../../appControllers/offersController');
const deleteJobOffer = require('../../appControllers/offersController');
const requestCandidateInfo = require('../../appControllers/offersController');
const candidateInfo = require('../../appControllers/offersController');

router.get('/dashboard', offersDashboard.offersDashboard);
router.get('/offer-details/:offerId', offerDetails.offerDetails);
router.get('/candidates/:offerId/:companyId', candidatesInOffer.candidatesInOffer);
router.post('/candidates/reject-candidate/:offerId/:companyId/:recommendationId', companyRejectCandidate.companyRejectCandidate);
router.get('/getData/:companyId', getCompanyData.getCompanyData)
router.post('/:companyId/post-job-offer', picUploader.single('offerPicture'), postJobOffer.postJobOffer);
router.put('/:companyId/:offerId/edit-offer', editJobOffer.editJobOffer);
router.post('/:companyId/:offerId/delete-offer', deleteJobOffer.deleteJobOffer);
router.post('/company/infoRequest/:offerId/:companyId/:recommendationId', requestCandidateInfo.requestCandidateInfo);
router.post('/:recommendationId/candidate-info', candidateInfo.candidateInfo);

module.exports = router