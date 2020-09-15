const express = require("express");
const router = express.Router();

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');

const {checkToken} = require("../../helpers/middlewares");

const authController = require('../../appControllers/companyControllers/companyAuthController');
const sendMailController = require('../../appControllers/sendMailController/sendMail');

router.post('/company/signup', authController.companySignUp);
router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);
router.post(`/resend`, resendToken);
router.post('/company/:companyId/complete-profile', authController.companyCompleteProfile)
router.post('/company/login', authController.companyLogin);
router.get('/company/:companyId/dashboard', checkToken, authController.getDashboard);
router.post('/company/:companyId/edit-profile', authController.editProfile);
router.post('/company/reset-password-email', authController.resetPasswordRoute);
router.post('/company/password-reset/:companyId', authController.passwordReset);
router.get('/company/getData/:companyId', authController.getCompanyData);
router.post("/company/logout", authController.companyLogout);
router.post('/:companyId/send-mail', sendMailController.sendMail);


module.exports = router