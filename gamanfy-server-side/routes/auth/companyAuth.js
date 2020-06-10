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
                    text: `Welcome to Gamanfy ${newCompany.firstName}.\n Please verify your account by clicking the link: https://gamanfy-c2371.web.app/auth-co/confirmation/${newCompany._id}/${token.token}\n`
                };

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
        const { description, companyName, taxId, countryCode, countryName, provinceCode, provinceDescription, provinceINEcode, municipalityINEcode, street, number, zip, provinceName, municipality, website, phoneNumber, numberOfEmployees } = req.body;
        let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip, municipality, provinceName, provinceCode, provinceDescription });
        let sectorId = await Sector.create(req.body);
        const updatedCompany = await Company.findByIdAndUpdate(checkCompany, { description, companyName, sectorId, taxId, addressId, website, phoneNumber, numberOfEmployees, website }, { new: true })
        req.session.currentUser = updatedCompany;
        res.status(200).json({ updatedCompany });

    } catch (error) {
        res.status(400).json({ error: 'An error occured while completing company profile' })
    }

})

router.post('/company/:companyId/edit-profile', async (req, res, next) => {


    try {
        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
       //console.log(checkCompany)
        //sectors
        const { _01_Administración_gubernamental, _02_Aeronáutica_aviación, _03_Agricultura, _04_Alimentación_y_bebidas, _05_Almacenamiento, _06_Arquitectura_y_planificación, _07_Artes_escénicas, _08_Artesanía, _09_Artículos_de_consumo, _10_Artículos_de_lujo_y_joyas, _11_Artículos_deportivos, _12_Atención_a_la_salud_mental, _13_Atención_sanitaria_y_hospitalaria, _14_Automación_industrial, _15_Banca, _16_Bellas_artes, _17_Bienes_inmobiliarios, _18_Biotecnología, _19_Construcción, _20_Consultoría, _21_Contabilidad, _22_Cosmética, _23_Deportes, _24_Derecho, _25_Desarrollo_de_programación, _26_Diseño, _27_Diseño_gráfico, _28_Dotación_y_selección_de_personal, _29_Educación_primaria_secundaria, _30_Energía_renovable_y_medio_ambiente, _31_Enseñanza_superior, _32_Entretenimiento, _33_Equipos_informáticos } = req.body;
        //addresses
        const { countryCode, provinceINEcode, municipalityINEcode, street, number, zip, provinceName, provinceCode, provinceDescription, municipalityCode, municipalityDescription } = req.body;
        //company
        const {firstName, lastName, description, companyName, email, password, isHeadHunter, taxId, contactPerson, yearsExp, website, phoneNumber, numberOfEmployees, countryName, city } = req.body;
       

        let addressId = await Address.findByIdAndUpdate(checkCompany.addressId, { $set: { province: { provinceName, provinceCode, provinceDescription }, municipality: { municipalityCode, municipalityDescription } }, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
        let sectorId = await Sector.findByIdAndUpdate(checkCompany.sectorId, { _01_Administración_gubernamental, _02_Aeronáutica_aviación, _03_Agricultura, _04_Alimentación_y_bebidas, _05_Almacenamiento, _06_Arquitectura_y_planificación, _07_Artes_escénicas, _08_Artesanía, _09_Artículos_de_consumo, _10_Artículos_de_lujo_y_joyas, _11_Artículos_deportivos, _12_Atención_a_la_salud_mental, _13_Atención_sanitaria_y_hospitalaria, _14_Automación_industrial, _15_Banca, _16_Bellas_artes, _17_Bienes_inmobiliarios, _18_Biotecnología, _19_Construcción, _20_Consultoría, _21_Contabilidad, _22_Cosmética, _23_Deportes, _24_Derecho, _25_Desarrollo_de_programación, _26_Diseño, _27_Diseño_gráfico, _28_Dotación_y_selección_de_personal, _29_Educación_primaria_secundaria, _30_Energía_renovable_y_medio_ambiente, _31_Enseñanza_superior, _32_Entretenimiento, _33_Equipos_informáticos }, { new: true });


        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);
        let updatedCompany = await Company.findByIdAndUpdate(checkCompany, {addressId, sectorId, description, companyName, firstName, lastName, email, password: hashPass, isHeadHunter, taxId, contactPerson, yearsExp, website, phoneNumber, numberOfEmployees, city, country }, { new: true });
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