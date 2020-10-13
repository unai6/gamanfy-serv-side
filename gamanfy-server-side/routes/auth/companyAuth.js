const express = require("express");
const router = express.Router();

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');

const {checkToken} = require("../../helpers/middlewares");

const authController = require('../../appControllers/companyControllers/companyAuthController');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const getDashboardController =  require('../../appControllers/companyControllers/getDashboard');
const editProfileController = require('../../appControllers/companyControllers/editProfile');

router.get('/company/:companyId/dashboard', checkToken, getDashboardController.getDashboard);
router.get('/company/getData/:companyId', authController.getCompanyData);
router.post('/company/signup', authController.companySignUp);
router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);
router.post(`/resend`, resendToken);
router.post('/company/:companyId/complete-profile', authController.companyCompleteProfile)
router.post('/company/login', authController.companyLogin);
router.post('/company/:companyId/edit-profile', editProfileController.editProfile);
router.post('/company/reset-password-email', authController.resetPasswordRoute);
router.post('/company/password-reset/:companyId', authController.passwordReset);
router.post("/company/logout", authController.companyLogout);
router.post('/:companyId/send-mail', sendMailController.sendMail);


module.exports = router