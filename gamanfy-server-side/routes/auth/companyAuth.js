const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Company = require('../../models/Company');
const CompanyToken = require('../../models/CompanyToken');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');

const companyAuthController = require('../../appControllers/companyControllers/companyAuthController');
const {
    confirmationToken,
    resendToken
} = require('../../appControllers/companyControllers/tokenControllers');


const {

    validationLoggin,
    checkToken
} = require("../../helpers/middlewares");



router.post(
    '/company/signup',
    
    
    
    
    async (req, res, next) => {

        let { firstName, lastName, email, password, companyName, isHeadHunter } = req.body;


        try {
            const emailExists = await Company.findOne({ email }, 'email');
            if (emailExists) {
                
                return res.json('email already exists in DB');
                
            } else if (isHeadHunter === 'on') {
                isHeadhunter = true

            } else {
                
                const salt = bcrypt.genSaltSync(saltRounds);
                const hashPass = bcrypt.hashSync(password, salt);
                const newCompany = await Company.create({ firstName, lastName, email, password: hashPass, companyName, isHeadHunter });
                const token = new CompanyToken({ _companyId: newCompany._id, token: crypto.randomBytes(16).toString('hex') });
                token.save(function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                });
                
                res
                .cookie(process.env.PUBLIC_DOMAIN, {
                  maxAge: 432000000,
                  httpOnly: true,
                  secure: false,
                  sameSite: true,
                })
                .status(200)
                
                let transporter = nodemailer.createTransport({
                    
                    host: 'smtp.ionos.es',
                    port: 587,
                    logger: true,
                    debug: true,
                    tls: {
                        secure: false,
                        ignoreTLS: true,
                        rejectUnauthorized: false
                    },
                    auth: {
                        user: process.env.HOST_MAIL,
                        pass: process.env.HOST_MAIL_PASSWORD
                    },

                });

                let mailOptions = {
                    from: process.env.HOST_MAIL,
                    to: newCompany.email,
                    subject: 'Account Verification Token',
                    text: `Welcome to Gamanfy ${newCompany.firstName}.\n Please verify your account by clicking the link: ${process.env.PUBLIC_DOMAIN}/auth-co/confirmation/${newCompany._id}/${token.token}\n`
                };
        

                transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).send('A verification email has been sent to ' + newCompany.email + '.');
                });

             

                res.status(200).json(newCompany);

            }
        } catch (error) {
            next(error);
        };
    });

router.post(`/confirmation/:companyId/:companyToken`, confirmationToken);

router.post(`/resend`, resendToken);


router.post('/company/login', companyAuthController.companyLogin);

router.post('/company/:companyId/complete-profile', async (req, res, next) => {

    try {
        res
      .cookie(process.env.PUBLIC_DOMAIN, {
        maxAge: 432000000,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      })
      .status(200) 
        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
        const { yearsExp, contactPerson, description, city, companyName, taxId, countryCode, countryName,
            provinceINEcode, municipalityINEcode, street, number, zip, province, municipality, website, phoneNumber, numberOfEmployees } = req.body;
        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, province, municipality, street, number, zip });
        let sectorId = await Sector.create(req.body);
        const updatedCompany = await Company.findByIdAndUpdate(checkCompany, {
            yearsExp, city, countryName, contactPerson, description,
            companyName, sectorId, taxId, addressId, website, phoneNumber, numberOfEmployees
        }, { new: true });
        res.status(200).json({ updatedCompany });


    } catch (error) {
        res.status(400).json({ error: 'An error occured while completing company profile' })
    }
})

router.put('/company/:companyId/edit-profile', async (req, res, next) => {


    try {

        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
        let { sector, province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip,
            isHeadHunter, companyName, firstName, lastName, email, password, city, phoneNumber, taxId, contactPerson,
            yearsExp, website, numberOfEmployees, description } = req.body;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);

        let addressId = await Address.findByIdAndUpdate(checkCompany.addressId, { province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
        let sectorId = await Sector.findByIdAndUpdate(checkCompany.sectorId, { sector }, { new: true });
        let updatedCompany = await Company.findByIdAndUpdate(checkCompany._id, {
            addressId, sectorId, isHeadHunter, companyName, firstName,
            lastName, email, password: hashPass, countryName, city, phoneNumber, taxId, contactPerson,
            yearsExp, website, numberOfEmployees, description
        }, { new: true });

      

        res.status(200).json({ updatedCompany });


    } catch (error) {
        res.status(400).json({ error: 'An error occurred while saving company data' });
    }
});


router.get('/company/:companyId/dashboard', checkToken, async (req, res) => {

    try {
        const { companyId } = req.params
        let getUserData = await Company.findById(companyId);

        if (getUserData.isVerified === true) {
            jwt.verify(req.token, process.env.SECRET_KEY, { companyId }, (err, authorizedData) => {
                if (err) {

                    res.status(403).json('Protected route, you need an auth Token');
                } else {

                    res.json({
                        message: 'Successful login',
                        authorizedData,

                    });

                    res.status(200).json('Successful connection to protected route');
                    res.json(getUserData)
                }
            });
        } else {
            res.status(404).json('User is not verified')
        }
    } catch (error) { res.status(404).json('User is not verified') }


});


router.get('/company/getData/:companyId', async (req, res) => {

    try {
        const { companyId } = req.params;

        let getCompanyData = await Company.findById(companyId);

        res.status(200).json(getCompanyData);

    } catch (error) {
        res.status(400).json({ mssg: 'error' })
    }

})

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


router.post('/send-mail', (req, res, next) => {
    const { companyName, businessName, phoneNumber, message, email } = req.body;

    try {


        let transporter = nodemailer.createTransport({

            host: 'smtp.ionos.es',
            port: 587,
            logger: true,
            debug: true,
            tls: {
                secure: false,
                ignoreTLS: true,
                rejectUnauthorized: false
            },
            auth: {
                user: process.env.HOST_MAIL,
                pass: process.env.HOST_MAIL_PASSWORD
            },

        });

        let mailOptions = {
            from: process.env.HOST_MAIL,
            to: email,
            subject: 'Gamanfy Staff',
            html: `
            <div> 
                <p>Thanks for contacting Gamanfy ${companyName} ${businessName}</p>
                <p>${message}</p>
                <p>You will receive a call at ${phoneNumber} for further information</p>

                Gamanfy Staff
            </div>
            `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(`email sent ${info.response}`)
            }
        });

    } catch (error) {
        next(error)
    }

});

module.exports = router