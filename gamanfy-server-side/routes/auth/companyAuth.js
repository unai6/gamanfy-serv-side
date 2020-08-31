const express = require("express");
const router = express.Router();

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');

const {checkToken} = require("../../helpers/middlewares");

const companyAuthController = require('../../appControllers/companyControllers/companyAuthController');
const getDashboardController= require('../../appControllers/companyControllers/getDashboard');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const editProfileController = require('../../appControllers/companyControllers/editProfile');
const resetPasswordRoute = require('../../appControllers/companyControllers/companyAuthController');
const passwordReset = require('../../appControllers/companyControllers/companyAuthController');
const getCompanyData = require('../../appControllers/companyControllers/companyAuthController');
const logout = require('../../appControllers/companyControllers/companyAuthController');

router.post('/company/signup', companyAuthController.companySignUp);
router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);
router.post(`/resend`, resendToken);
router.post('/company/:companyId/complete-profile', companyAuthController.companyCompleteProfile)
router.post('/company/login', companyAuthController.companyLogin);
router.get('/company/:companyId/dashboard', checkToken, getDashboardController.getDashboard);
router.post('/company/:companyId/edit-profile', editProfileController.editProfile);
router.post('/company/reset-password-email', resetPasswordRoute.resetPasswordRoute);
router.post('/company/password-reset/:companyId', passwordReset.passwordReset);
router.get('/company/getData/:companyId', getCompanyData.getCompanyData);
router.post("/company/logout", logout.companyLogout);
router.post('/:companyId/send-mail', sendMailController.sendMail);


module.exports = router