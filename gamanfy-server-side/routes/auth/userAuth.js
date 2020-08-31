const express = require("express");
const router = express.Router();


const picUploader = require('../../config/picsUploader');
const getUserData = require('../../appControllers/userControllers/userAuthController');
const userAuthController = require('../../appControllers/userControllers/userAuthController');
const userEditProfileController = require('../../appControllers/userControllers/editProfile');
const userChangeProfilePic = require('../../appControllers/userControllers/editProfile');
const {confirmationToken, resendToken } = require('../../appControllers/userControllers/tokenControllers');
const getDashboardController= require('../../appControllers/userControllers/getDahsboard');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const {  validationLoggin, checkToken} = require("../../helpers/middlewares");
const logout = require('../../appControllers/userControllers/userAuthController');

router.post('/user/signup', userAuthController.userSignup);
router.post(`/confirmation/:userId/:userToken/:isCompany`, confirmationToken);
router.post('/resend', resendToken);
router.post('/user/login',  userAuthController.login);
router.get('/user/:userId/dashboard', checkToken, getDashboardController.getUserDashboard);
router.post('/user/:userId/:isaCompany/complete-profile', userAuthController.userCompleteProfile);
router.put('/user/:userId/edit-profile', userEditProfileController.editProfile);
router.post('/user/:userId/change-profile-picture', picUploader.single("imageUrl"), userChangeProfilePic.userChangeProfilePic)
router.post("/user/logout", logout.userLogout);
router.get('/user/getData/:userId', getUserData.getUserData);
router.post('/send-mail', sendMailController.sendMail);

module.exports = router