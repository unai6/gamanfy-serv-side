const express = require("express");
const router = express.Router();

const { user } = require('../../appControllers');
const picUploader = require('../../config/picsUploader');
const uploader = require('../../config/uploadsForPDF');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const { checkToken } = require("../../helpers/middlewares");

router.get('/user/:userId/dashboard', checkToken, user.getUserDashboard);
router.get('/user/getData/:userId', user.getUserData);
router.put('/user/:userId/edit-profile', user.editProfile);
router.post('/user/signup', user.userSignup);
router.post(`/confirmation/:userId/:userToken/:isCompany`, user.confirmationToken);
router.post('/resend', user.resendToken);
router.post('/user/login',  user.login);
router.post('/user/:userId/:isaCompany/complete-profile', uploader.single('curriculum'), user.userCompleteProfile);
router.post('/user/:userId/change-profile-picture', picUploader.single("imageUrl"), user.userChangeProfilePic)
router.post("/user/logout", user.userLogout);
router.post('/user/reset-password-email', user.resetPasswordRoute);
router.post('/user/password-reset/:userId', user.passwordReset);
router.post('/send-mail', sendMailController.sendMail);

module.exports = router