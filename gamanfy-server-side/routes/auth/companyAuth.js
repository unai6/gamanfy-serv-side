const express = require("express");
const router = express.Router();
const Company = require('../../models/Company');

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');

const {
    
    checkToken
} = require("../../helpers/middlewares");

const companyAuthController = require('../../appControllers/companyControllers/companyAuthController');
const getDashboardController= require('../../appControllers/companyControllers/getDashboard');
const sendMailController = require('../../appControllers/sendMailController/sendMail');
const editProfileController = require('../../appControllers/companyControllers/editProfile');


router.post('/company/signup', companyAuthController.companySignUp);
router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);
router.post(`/resend`, resendToken);
router.post('/company/:companyId/complete-profile', companyAuthController.companyCompleteProfile)
router.post('/company/login', companyAuthController.companyLogin);
router.get('/company/:companyId/dashboard', checkToken, getDashboardController.getDashboard);
router.post('/company/:companyId/edit-profile', editProfileController.editProfile);

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


router.post('/:companyId/send-mail', sendMailController.sendMail);


module.exports = router