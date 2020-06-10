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
                    text: `Welcome to Gamanfy ${newUser.firstName}.\n Please verify your account by clicking the link: https://gamanfy-c2371.web.app/auth/confirmation/${newUser._id}/${token.token}\n`
                };

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


router.post(`/confirmation/:userId/:userToken`, confirmationToken);

router.post('/resend', resendToken);

router.post('/user/login', userAuthController.login);

router.post('/user/:userId/:isCompany/complete-profile', async (req, res, next) => {

    try {
        let { userId, isCompany} = req.params;
        const { companyName, documentType, documentNumber, website, city, country, phoneNumber, numberOfEmployees, urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode, municipalityCode, municipalityDescription, street, number, zip, invited, webCreated } = req.body;
        const checkUser = await InfluencerUser.findById(userId);
         isCompany = checkUser.isCompany
        
        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip });
        let sectorId = await Sector.create(req.body);
        if (checkUser.isCompany) {
          
            const companyUser = await CompanyUser.create({ sectorId, addressId, companyName, documentType, numberOfEmployees, documentNumber, website, city, country });
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { companyUser, addressId }, { new: true });
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });


        } else if (checkUser.isCompany === false) {
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { addressId, city, country, phoneNumber, urlLinkedin, birthDate, hasExp }, { new: true });
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });

        } else if (checkUser.isCandidate) {
            const candidateUser = await CandidateUser.create({ invited, webCreated });
            await InfluencerUser.findByIdAndUpdate(checkUser, { candidateUser }, { new: true });
            res.status(200).json({ candidateUser });
        };

    } catch (error) {
        res.status(500).json({ error: 'An error ocurred while saving data' })
    }

});

router.post('/user/:userId/edit-profile', async (req, res, next) => {

    try {
        const { userId } = req.params;
        const checkUser = await InfluencerUser.findById(userId);

        //companyUser/candidateUser
        const { contactPerson, companyName, documentType, documentNumber, website, numberOfEmployees, invited, webCreated } = req.body;
        //sectors
        const { _01_Administración_gubernamental, _02_Aeronáutica_aviación, _03_Agricultura, _04_Alimentación_y_bebidas, _05_Almacenamiento, _06_Arquitectura_y_planificación, _07_Artes_escénicas, _08_Artesanía, _09_Artículos_de_consumo, _10_Artículos_de_lujo_y_joyas, _11_Artículos_deportivos, _12_Atención_a_la_salud_mental, _13_Atención_sanitaria_y_hospitalaria, _14_Automación_industrial, _15_Banca, _16_Bellas_artes, _17_Bienes_inmobiliarios, _18_Biotecnología, _19_Construcción, _20_Consultoría, _21_Contabilidad, _22_Cosmética, _23_Deportes, _24_Derecho, _25_Desarrollo_de_programación, _26_Diseño, _27_Diseño_gráfico, _28_Dotación_y_selección_de_personal, _29_Educación_primaria_secundaria, _30_Energía_renovable_y_medio_ambiente, _31_Enseñanza_superior, _32_Entretenimiento, _33_Equipos_informáticos } = req.body;
        //addresses
        const { countryCode, provinceINEcode, municipalityINEcode, street, number, zip, provinceName, provinceCode, provinceDescription, municipalityCode, municipalityDescription } = req.body;
        //influencerUser
        const { firstName, lastName, email, password, isCompany, country, phoneNumber, city, birthDate, urlLinkedin, hasExp, actualPosition, yearsExp, actualSalary, profileDescription, yearsInPosition } = req.body;


        if (checkUser.isCompany) {
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            let addressId = await Address.findByIdAndUpdate(checkUser.addressId, { $set: { province: { provinceName, provinceCode, provinceDescription }, municipality: { municipalityCode, municipalityDescription } }, countryCode, country, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
            let sectorId = await Sector.findOneAndUpdate({ _01_Administración_gubernamental, _02_Aeronáutica_aviación, _03_Agricultura, _04_Alimentación_y_bebidas, _05_Almacenamiento, _06_Arquitectura_y_planificación, _07_Artes_escénicas, _08_Artesanía, _09_Artículos_de_consumo, _10_Artículos_de_lujo_y_joyas, _11_Artículos_deportivos, _12_Atención_a_la_salud_mental, _13_Atención_sanitaria_y_hospitalaria, _14_Automación_industrial, _15_Banca, _16_Bellas_artes, _17_Bienes_inmobiliarios, _18_Biotecnología, _19_Construcción, _20_Consultoría, _21_Contabilidad, _22_Cosmética, _23_Deportes, _24_Derecho, _25_Desarrollo_de_programación, _26_Diseño, _27_Diseño_gráfico, _28_Dotación_y_selección_de_personal, _29_Educación_primaria_secundaria, _30_Energía_renovable_y_medio_ambiente, _31_Enseñanza_superior, _32_Entretenimiento, _33_Equipos_informáticos });
            const isCompanyUser = await CompanyUser.findOneAndUpdate({ companyName, contactPerson, documentType, numberOfEmployees, documentNumber, website, city, country });
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { firstName, lastName, addressId, sectorId, isCompanyUser, phoneNumber, password: hashPass, email }, { new: true });
            req.session.currentUser = updatedUser;
            res.status(200).json({ updatedUser });


        } else if (checkUser.isCompany === false || checkUser.isCompany === null) {
            // console.log(checkUser)
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            let addressId = await Address.findByIdAndUpdate(checkUser.addressId, { $set: { province: { provinceName, provinceCode, provinceDescription }, municipality: { municipalityCode, municipalityDescription } }, countryCode, country, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
            const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { isCompany, firstName, lastName, email, password: hashPass, addressId, city, country, phoneNumber, urlLinkedin, birthDate, actualPosition, yearsExp, actualSalary, hasExp, profileDescription, yearsInPosition }, { new: true });
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