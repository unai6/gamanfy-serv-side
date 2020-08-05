const express = require("express");
const router = express.Router();
const InfluencerUser = require("../../models/InfluencerUser");

const uploader = require("../../config/cloudinary");

const userAuthController = require('../../appControllers/userControllers/userAuthController');
const userEditProfileController = require('../../appControllers/userControllers/editProfile');

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/userControllers/tokenControllers');

const getDashboardController= require('../../appControllers/userControllers/getDahsboard');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const {  
    validationLoggin,
    checkToken
} = require("../../helpers/middlewares");


router.post('/user/signup', userAuthController.userSignup);
router.post(`/confirmation/:userId/:userToken/:isCompany`, confirmationToken);
router.post('/resend', resendToken);
router.post('/user/login',  userAuthController.login);
router.post('/user/:userId/:isaCompany/complete-profile', userAuthController.userCompleteProfile);
router.put('/user/:userId/edit-profile', userEditProfileController.editProfile);
router.get('/user/:userId/dashboard', checkToken, getDashboardController.getUserDashboard);


/* router.post("/upload", uploader.single("imageUrl"), (req, res, next) => {
  if (!req.file) {
    next(new Error("No file uploaded!"));
    return;
  }

  res.json({ secure_url: req.file.secure_url });
});
  */

router.post("/user/logout", async (req, res, next) => {
    try {
        res.clearCookie(process.env.PUBLIC_DOMAIN);
        res.status(200).json({ msg: "Log out sucesfully" });
      } catch (e) {
        console.error(e);
        res.status(500).json({ msg: "Server error" });
      }
    return;
});

router.get('/user/getData/:userId', async (req, res) => {

    try {
        const { userId } = req.params;

        let getUserData = await InfluencerUser.findById(userId).populate('companyUser addressId recommendedPeople');

        res.status(200).json(getUserData);

    } catch (error) {
        res.status(400).json({ mssg: 'error' })
    }

});


router.post('/send-mail', sendMailController.sendMail);

module.exports = router