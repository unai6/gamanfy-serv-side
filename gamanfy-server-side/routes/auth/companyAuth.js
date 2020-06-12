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
    isLoggedIn,
    isNotLoggedIn,
    validationLoggin,
    checkToken
} = require("../../helpers/middlewares");



router.post(
    '/company/signup',

    isNotLoggedIn(),
    validationLoggin(),

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
                const newCompany = await Company.create({firstName, lastName, email, password: hashPass, companyName, isHeadHunter });
                const token = new CompanyToken({ _companyId: newCompany._id, token: crypto.randomBytes(16).toString('hex') });
                token.save(function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                });

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
                   // https://gamanfy-c2371.web.app/auth-co/confirmation/${newCompany._id}/${token.token}/${newCompany.isCompany}\n
                // ${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newCompany._id}/${token.token}/${newCompany.isCompany}\n`

                transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                    res.status(200).send('A verification email has been sent to ' + newCompany.email + '.');
                });

                req.session.currentUser = newCompany;

                res.status(200).json(newCompany);

            }
        } catch (error) {
            next(error);
        };
    });

    router.post(`/confirmation/:companyId/:companyToken`, confirmationToken, (req, res, next) => {
    });
    
    router.post(`/resend`, resendToken, (req, res,next) =>{
    });
    

    router.post('/company/login', 
    companyAuthController.companyLogin
  );

router.post('/company/:companyId/complete-profile', async (req, res, next) => {

    try {
        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
        const { yearsExp, contactPerson, description, city, companyName, taxId, countryCode, countryName, 
            provinceINEcode, municipalityINEcode, street, number, zip, province, municipality, website, phoneNumber, numberOfEmployees } = req.body;
        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, province, municipality, street, number, zip });
        let sectorId = await Sector.create(req.body);
        const updatedCompany = await Company.findByIdAndUpdate(checkCompany, { yearsExp, city, countryName, contactPerson, description, 
            companyName, sectorId, taxId, addressId, website, phoneNumber, numberOfEmployees}, { new: true })
        req.session.currentUser = updatedCompany;
        res.status(200).json({ updatedCompany });

    } catch (error) {
        res.status(400).json({ error: 'An error occured while completing company profile' })
    }
})

router.put('/company/:companyId/edit-profile', async (req, res, next) => {


    try {
        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
       //console.log(checkCompany)
        //sectors
        const {sector}= req.body;
        const { countryCode, provinceINEcode, municipalityINEcode, street, number, zip, province,  municipality } = req.body;
        //company
        const {firstName, lastName, description, companyName, email, password, isHeadHunter, taxId, contactPerson, yearsExp, website, phoneNumber, numberOfEmployees, countryName, city } = req.body;
       

        let addressId = await Address.findByIdAndUpdate(checkCompany.addressId, { province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
        let sectorId = await Sector.findByIdAndUpdate(checkCompany.sectorId, {sector}, { new: true });


        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);
        let updatedCompany = await Company.findByIdAndUpdate(checkCompany._id, {addressId, sectorId, description, companyName, firstName, lastName, email, password: hashPass, isHeadHunter, taxId, contactPerson, yearsExp, website, phoneNumber, numberOfEmployees, city, countryName }, { new: true });
        req.session.currentUser = updatedCompany;
        
        res.status(200).json({ updatedCompany });


    } catch (error) {
        res.status(400).json({ error: 'An error occurred while saving company data' });
    }
});


router.get('/company/:companyId/dashboard', checkToken, (req, res) => {
    const { companyId } = req.params

    jwt.verify(req.token, process.env.SECRET_KEY, { companyId }, (err, authorizedData) => {
        if (err) {

            res.status(403).json('Protected route, you need an auth Token');
        } else {

            res.json({
                message: 'Successful login',
                authorizedData
            });

            res.status(200).json('Successful connection to protected route');
        }
    });
});


router.post("/company/logout", isLoggedIn(), (req, res, next) => {
    req.session.destroy();

    res.status(204).send();
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