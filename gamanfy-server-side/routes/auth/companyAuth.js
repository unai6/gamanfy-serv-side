const express = require("express");
const router = express.Router();
const Company = require('../../models/Company');


const companyAuthController = require('../../appControllers/companyControllers/companyAuthController');
const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');
const editProfileController = require('../../appControllers/companyControllers/editProfile');
const {

    validationLoggin,
    checkToken
} = require("../../helpers/middlewares");
const getDashboardController= require('../../appControllers/companyControllers/getDashboard');
const sendMailController = require('../../appControllers/sendMailController/sendMail');



router.post('/company/signup', companyAuthController.companySignUp);
router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);
router.post(`/resend`, resendToken);
router.post('/company/login', companyAuthController.companyLogin);
router.post('/company/:companyId/complete-profile', companyAuthController.companyCompleteProfile)
router.put('/company/:companyId/edit-profile', checkToken, editProfileController.editProfile);
router.get('/company/:companyId/dashboard', checkToken, getDashboardController.getDashboard);

router.get('/company/getData/:companyId', async (req, res) => {

    try {
        const { companyId } = req.params;

        let getCompanyData = await Company.findById(companyId);

        res.status(200).json(getCompanyData);

    } catch (error) {
        res.status(400).json({ mssg: 'error' })
    }

});
router.post("/company/logout", async (req, res, next) => {
    try {
        res.clearCookie(process.env.PUBLIC_DOMAIN);
        res.status(200).json({ msg: "Log out sucesfully" });
      } catch (e) {
        console.error(e);
        res.status(500).json({ msg: "Server error" });
      }
    return;
});


router.post('/send-mail', sendMailController.sendMail);

module.exports = router