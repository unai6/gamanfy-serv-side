const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const InfluencerUser = require('../../models/InfluencerUser');
const CandidateUser = require('../../models/CandidateUser');
const CompanyUser = require('../../models/CompanyUser');
const UserToken = require('../../models/UserToken');
const Address = require('../../models/Address');
const Sector = require('../../models/Sector');
const userAuthController = require('../../appControllers/userControllers/userAuthController');

const {
    confirmationToken,
    resendToken
} = require('../../appControllers/userControllers/tokenControllers');

const {
    isLoggedIn,
    isNotLoggedIn,
    validationLoggin,
    checkToken
} = require("../../helpers/middlewares");

router.post(
    '/user/signup',

    isNotLoggedIn(),
    validationLoggin(),

    async (req, res, next) => {

        let { email, password, repeatPassword, firstName, lastName, isCompany, isCandidate } = req.body;


        try {

            if (isCompany === 'on') {
                isCompany = true
            } else if (isCandidate === 'on') {
                isCandidate = true
            } else if (password !== repeatPassword) {
                return res.json('Passwords must match');
            }
            const emailExists = await InfluencerUser.findOne({ email });

            if (emailExists) {
                console.log('email already exists in db');
                return res.status(400).json('email already exists in DB');

            } else {

                const salt = bcrypt.genSaltSync(saltRounds);
                const hashPass = bcrypt.hashSync(password, salt);
                const newUser = await InfluencerUser.create({ email, password: hashPass, firstName, lastName, isCompany });
                const token = new UserToken({ _userId: newUser._id, token: crypto.randomBytes(16).toString('hex') });
                await token.save(function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                });

                let transporter = await nodemailer.createTransport({

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
                    to: newUser.email,
                    subject: 'Account Verification Token',
                    text: `Welcome to Gamanfy ${newUser.firstName}.\n Please verify your account by clicking the link:  ${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}\n`
                };
                // https://gamanfy-c2371.web.app/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}\n
                // ${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}\n`
                await transporter.sendMail(mailOptions, function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); } 
                    res.status(200).send('A verification email has been sent to ' + newUser.email + '.');
                });
                console.log(newUser.firstName)
                res.status(200).json(newUser);

            }
        } catch (error) {
            next(error);
        };

    });


router.post(`/confirmation/:userId/:userToken/:isCompany`, confirmationToken);

router.post('/resend', resendToken);

router.post('/user/login', userAuthController.login);

router.post('/user/:userId/:isaCompany/complete-profile', async (req, res, next) => {

    try {
        let { isaCompany, userId} = req.params;
        
        const { companyName, documentType, documentNumber, contactPerson, taxId, website, city,  phoneNumber, numberOfEmployees,
             urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
              street, number, zip, invited, webCreated, province, municipality  } = req.body;

        const checkUser = await InfluencerUser.findById(userId);
        isaCompany = checkUser.isCompany

        let addressId = await Address.create({
            province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip });
        
        let sectorId = await Sector.create(req.body);
        if (checkUser.isCompany) {
            const companyUser = await CompanyUser.create({ sectorId, addressId, phoneNumber, taxId, companyName, contactPerson, 
                documentType, numberOfEmployees, documentNumber, website, city, countryName });

            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { companyUser, addressId }, { new: true });
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });


        } else if (checkUser.isCompany === false) {
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { addressId, city,  phoneNumber, urlLinkedin, birthDate, hasExp }, { new: true });
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });

        } else if (checkUser.isCandidate) {
            const candidateUser = await CandidateUser.create({ invited, webCreated });
            await InfluencerUser.findByIdAndUpdate(checkUser, { candidateUser }, { new: true });
            res.status(200).json({ candidateUser });
        };

    } catch (error) {
        res.status(400).json({ error: 'An error ocurred while saving data' })
    }

});

router.put('/user/:userId/edit-profile', async (req, res, next) => {

    try {
        

        const { userId } = req.params;
        const checkUser = await InfluencerUser.findById(userId).populate('companyUser');

        //companyUser/candidateUser
        const { description, taxId, contactPerson, companyName, documentType, documentNumber, website, numberOfEmployees,
             invited, webCreated } = req.body;
        //sectors
        const { sector} = req.body;
        //addresses
        const { countryName, countryCode, provinceINEcode, municipalityINEcode, street, number, zip , province, municipality } = req.body;
        //influencerUser
        const { firstName, lastName, email, password, isCompany, phoneNumber, city, birthDate, urlLinkedin, hasExp,
             actualPosition, yearsExp, actualSalary, profileDescription, yearsInPosition } = req.body;
            
      console.log( checkUser)
        if (checkUser.isCompany === true) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            let addressId = await Address.findByIdAndUpdate(checkUser.companyUser.addressId, {countryName, province, municipality, 
                countryCode, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
            let sectorId = await Sector.findByIdAndUpdate(checkUser.companyUser.sectorId, { sector }, {new:true});
            
            let isCompanyUser = await CompanyUser.findByIdAndUpdate(checkUser.companyUser._id, { description, taxId, companyName,
                 contactPerson, phoneNumber, addressId, sectorId, documentType, numberOfEmployees, documentNumber, website, city,
                  countryName }, {new:true});
            let updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser._id, {isCompanyUser, password: hashPass, email }, { new: true });
            
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });


        } else if (checkUser.isCompany === false || checkUser.isCompany === null) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            let addressId = await Address.findByIdAndUpdate(checkUser.addressId, { province, municipality, countryCode, countryName,  provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { isCompany, firstName, lastName, email, password: hashPass, addressId, city,  phoneNumber, urlLinkedin, birthDate, actualPosition, yearsExp, actualSalary, hasExp, profileDescription, yearsInPosition }, { new: true });
            console.log(currentUser)
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });
        }
    } catch (error) {
        res.status(400).json({ error: 'An error occurred while updating user' });
    };



})


router.get('/user/:userId/dashboard', checkToken, async (req, res) => {
    const { userId } = req.params

    await jwt.verify(req.token, process.env.SECRET_KEY, userId, (err, authorizedData) => {
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



router.post("/user/logout", isLoggedIn(), (req, res, next) => {
    req.session.destroy();
    res.status(204).send();
    return;
});

router.post('/send-mail', (req, res, next) => {
    const { firstName, lastName, phoneNumber, message, email } = req.body;

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
                <p>Thanks for contacting us ${firstName} ${lastName}</p>
                <p>${message}</p>
                <p>You will be contacted at ${phoneNumber} for further information</p>

                Gamanfy Staff
            </div>
            `
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log(`email sent: ${info.response}`)
            }
        });

    } catch (error) {
        next(error)
    }

});

module.exports = router