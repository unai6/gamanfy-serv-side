const InfluencerUser = require('../../models/InfluencerUser');
const CandidateUser = require('../../models/CandidateUser');
const CompanyUser = require('../../models/CompanyUser');
const UserToken = require('../../models/UserToken');
const Address = require('../../models/Address');
const Sector = require('../../models/Sector');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { signToken } = require('../../helpers/signToken');
let inLineCss = require('nodemailer-juice');

const user = {

    userSignup: async (req, res, next) => {

        let { email, password, repeatPassword, firstName, lastName, isCompany, termsAccepted } = req.body;
        try {

            if (isCompany === 'on') {
                isCompany = true
            } else if (password !== repeatPassword) {
                return console.log('Passwords must match');
            }
            const emailExists = await InfluencerUser.findOne({ email });

            if (emailExists) {
                console.log('email already exists in db');
                return res.status(400).send('email already exists in DB');

            } else {

                const salt = bcrypt.genSaltSync(saltRounds);
                const hashPass = bcrypt.hashSync(password, salt);
                const newUser = await InfluencerUser.create({ email, password: hashPass, firstName, lastName, isCompany, termsAccepted });

                const token = new UserToken({ _userId: newUser._id, token: crypto.randomBytes(16).toString('hex') });
                await token.save(function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
                });


                let transporter = nodemailer.createTransport({

                    host: 'smtp.ionos.es',
                    port: 587,
                    logger: true,
                    // debug: true,
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

                transporter.use('compile', inLineCss());

                let mailOptions = {
                    from: process.env.HOST_MAIL,
                    to: newUser.email,
                    subject: 'Verificación de la Cuenta',
                    html: `
              <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
              <div>
                  <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${newUser.firstName}! Nos alegramos mucho<br> de poder contar contigo </p>\n
      
                   <div style='font-weight:300; color:#535353; font-size:14px; margin:1.5em 0 1em 1em'>
                       Tu cuenta ha sido creada y ya tienes todo listo para comenzar.</br>
                       Haz click en este botón para verificar tu cuenta.</br>
                  </div>
                  <a href="${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:14em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Verificar cuenta</a><br/>
              </div> \n`,
                    attachments: [{
                        filename: 'Anotación 2020-07-30 172748.png',
                        path: 'public/Anotación 2020-07-30 172748.png',
                        cid: 'unique@nodemailer.com'
                    }]
                };
                /* verify connection configuration
                transporter.verify(function (error, success) {  
                  if (error) {
                    console.log(error);
                  } else {
                    res.status(200).json(success)
                    console.log("Server is ready to take our messages", success);
                  }
                });*/

                const mailSent = await transporter.sendMail(mailOptions)
                res.status(200).send({ message: `A verification recommendedEmail has been sent to ${newUser.email} from ${process.env.HOST_MAIL}`, response: mailSent });

            }
        } catch (error) {
            return res.status(500).send({ msg: error });
        };

    },

    login: async (req, res) => {
        const { email, password, remember } = req.body;

        try {
            let user = await InfluencerUser.findOne({ email });

            if (!user) return res.status(404).json({ msg: 'User not found' });

            const passCorrect = bcrypt.compareSync(password, user.password);
            if (!passCorrect) {
                return res.status(401).json({ msg: 'Email or password not valid' })

            } else if (passCorrect) {

                res.cookie(process.env.PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN, {
                    maxAge: 432000000,
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                }).status(200)


                const token = signToken(user, remember);
                res.status(200).json({
                    token,
                    user: {
                        userId: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        isVerified: user.isVerified,
                        isCompleted: user.isCompleted,
                        isCompany: user.isCompany,
                        isItaCompany: false

                    }
                });

            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ msg: "Server error" });
        }
    },

    userCompleteProfile: async (req, res) => {

        try {
            let { userId } = req.params;

            const { companyName, documentType, documentNumber, contactPerson, taxId, website, city, phoneNumber, numberOfEmployees,
                urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
                street, number, zip, invited, webCreated, province, municipality } = req.body;

            let curriculum;

            if (req.file !== undefined) {
                curriculum = req.file.path
            } else {
                curriculum = 'No curriculum provided';
            }


            const checkUser = await InfluencerUser.findById(userId);


            let addressId = await Address.create({
                province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip
            });

            let sectorId = await Sector.create(req.body);

            if (checkUser.isCompany) {
                const companyUser = await CompanyUser.create({
                    sectorId, addressId, phoneNumber, taxId, companyName, contactPerson,
                    documentType, numberOfEmployees, documentNumber, website, city, countryName,
                });


                res.cookie(process.env.PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN, {
                    maxAge: 432000000,
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                })
                    .status(200)

                const token = signToken(checkUser)

                const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { companyUser, addressId, isCompleted: true, curriculum: curriculum, hasExp }, { new: true });
                res.status(200).json({
                    updatedUser, token,
                    user: {
                        userId: checkUser.id,
                        email: checkUser.email,
                        firstName: checkUser.firstName,
                        isVerified: checkUser.isVerified,
                        isCompleted: checkUser.isCompleted,
                        isCompany: checkUser.isCompany,
                        isItaCompany: false

                    }
                });


            } else if (checkUser.isCompany === false) {

                res.cookie(process.env.PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN, {
                    maxAge: 432000000,
                    httpOnly: true,
                    sameSite: 'none',
                    secure: true,
                })
                    .status(200)

                const token = signToken(checkUser)
                const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { addressId, city, phoneNumber, urlLinkedin, birthDate, hasExp, isCompleted: true, curriculum: curriculum }, { new: true });

                res.status(200).json({
                    updatedUser, token,
                    user: {
                        userId: checkUser.id,
                        email: checkUser.email,
                        firstName: checkUser.firstName,
                        isVerified: checkUser.isVerified,
                        isCompleted: checkUser.isCompleted,
                        isCompany: checkUser.isCompany,
                        isItaCompany: false
                    }
                });

            } else if (checkUser.isCandidate) {
                const candidateUser = await CandidateUser.create({ invited, webCreated });
                await InfluencerUser.findByIdAndUpdate(checkUser, { candidateUser }, { new: true });
                res.status(200).json({ candidateUser });
            };

        } catch (error) {
            console.log(error)
            res.status(400).json({ error: 'An error ocurred while saving data' })
        }

    },

    getUserData: async (req, res) => {

        try {
            const { userId } = req.params;

            let getUserData = await InfluencerUser.findById(userId).populate('companyUser addressId recommendedPeople');

            res.status(200).json(getUserData);

        } catch (error) {
            res.status(400).json({ mssg: 'error' })
        }

    },

    getUserDashboard: async (req, res) => {
        try {
            const { userId } = req.params
            let getUserData = await InfluencerUser.findById(userId).populate('companyUser recommendedPeople');

            if (getUserData.isVerified === true) {
                jwt.verify(req.token, process.env.SECRET_KEY, { userId }, (err, authorizedData) => {
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


    },

    userChangeProfilePic : async ( req, res) => {
        try{
            const { userId } = req.params;
    
            const imageUrl = req.file.path;
    
                await InfluencerUser.findByIdAndUpdate(userId, {
                    imageUrl:imageUrl
                });
    
                res.status(200).json({ message: 'influencer user updated correctly' });
            
    
        }catch(error){
            res.status(400).json({error:'Error'})
        }
    },

    editProfile : async (req, res, next) => {

        try {
    
            const { userId } = req.params;
    
            const isCompanyUser = await InfluencerUser.findById(userId).populate('companyUser');
            
            let { companyName, documentType, documentNumber, contactPerson, taxId, website, city, phoneNumber, numberOfEmployees,
                urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
                street, number, zip, invited, webCreated, province, municipality, sector, email, firstName, lastName, isCompany, isCandidate,
                yearsExp, actualPosition, yearsInPosition, actualCompany, profileDescription, actualSalary, password } = req.body;
    
            if (isCompanyUser.isCompany) {
    
                const salt = bcrypt.genSaltSync(saltRounds);
                const hashPass = bcrypt.hashSync(password, salt);
    
                let addressId = await Address.findByIdAndUpdate(isCompanyUser.companyUser.addressId, {
                    province, municipality, countryCode,
                    countryName, provinceINEcode, municipalityINEcode, street, number, zip
                });
    
                let sectorId = await Sector.findByIdAndUpdate(isCompanyUser.companyUser.sectorId, { sector });
    
                let companyUser = await CompanyUser.findByIdAndUpdate(isCompanyUser.companyUser, {
                    sectorId, addressId, phoneNumber, taxId, companyName, contactPerson, documentType, numberOfEmployees, documentNumber,
                    website, city, countryName
                });
    
                let updatedUser = await InfluencerUser.findByIdAndUpdate(isCompanyUser, {
                    companyUser, addressId, email, password: hashPass, firstName, lastName, phoneNumber
                });
    
                res.status(200).json({ message: 'company user updated correctly' });
    
            } else {
                let addressId = await Address.findByIdAndUpdate(isCompanyUser.addressId, {
                    province, municipality, countryCode,
                    countryName, provinceINEcode, municipalityINEcode, street, number, zip
                });
                const salt = bcrypt.genSaltSync(saltRounds);
                const hashPass = bcrypt.hashSync(password, salt);
                let updatedUser = await InfluencerUser.findByIdAndUpdate(isCompanyUser._id, {
                    firstName, lastName, password: hashPass, birthDate, email, addressId,
                    phoneNumber, countryName, city, urlLinkedin, isCompany, isCandidate, hasExp, yearsExp, actualPosition, yearsInPosition,
                    actualCompany, profileDescription, actualSalary
                });
    
                res.status(200).json({ message: 'influencer user updated correctly' })
    
            };
    
        } catch (error) {
            res.status(400).json({ message: 'An error occured while editing user profile' });
        }
    
    },

    userLogout: async (req, res, next) => {
        try {
            res.clearCookie(process.env.PUBLIC_DOMAIN);
            res.status(200).json({ msg: "Log out sucesfully" });
        } catch (e) {
            console.error(e);
            res.status(500).json({ msg: "Server error" });
        }
        return;
    },

    resetPasswordRoute: async (req, res) => {

        const { email } = req.body;
        try {

            const user = await InfluencerUser.findOne({ email })


            let transporter = nodemailer.createTransport({

                host: 'smtp.ionos.es',
                port: 587,
                logger: true,
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

            transporter.use('compile', inLineCss());


            let mailOptions = {
                from: process.env.HOST_MAIL,
                to: user.email,
                subject: ` Reset password ${user.firstName}`,
                html: `
            <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
            <div>
                <p style='font-weight:600; color:#535353; font-size:18px; text-align:center'> ¡Hola ${user.firstName}! </p>\n
      
                 <div style='font-weight:300; color:#535353; font-size:14px; margin:1.5em 0 1em 1em'>
                     Haz click en el botón para restablecer tu contraseña. </br>
                     
                </div>
                <a href="${process.env.PUBLIC_DOMAIN}/auth/user/password-reset/${user._id}" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:14em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Haz click aquí</a><br/>
            </div> \n`,
                attachments: [{
                    filename: 'Anotación 2020-07-30 172748.png',
                    path: 'public/Anotación 2020-07-30 172748.png',
                    cid: 'unique@nodemailer.com'
                }]
            };

            transporter.sendMail(mailOptions, function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
                res.status(200).send('A verification email has been sent to ' + user.email + '.');
            });


        } catch (error) {
            res.send(error)
        }

    },

    passwordReset: async (req, res, next) => {


        try {
            const { userId } = req.params;
            const { password, repeatPassword } = req.body;
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            const user = await InfluencerUser.findById(userId);


            if (password !== repeatPassword) {
                res.status(400).send('Passwords must match')
            }
            const updatedUser = await InfluencerUser.findByIdAndUpdate(user._id, { password: hashPass });

            res.status(200).json({ updatedUser })

        } catch (error) {
            next(error)
        }

    },

    confirmationToken : function (req, res, next) {
        const { token, email } = req.body
        UserToken.findOne(token, function (err, token) {
            if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });
            console.log(token)
    
            InfluencerUser.findOne({ email: req.body.email, userId: req.body.userId }, function (err, userinDB) {
    
                if (!userinDB) return res.status(404).send({ msg: 'We were unable to find a user for this token.' });
                if (userinDB.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This user has already been verified.' });
                userinDB.isVerified = true;
                userinDB.save(function (err) {
                    if (err) { return res.status(500).send({ msg: err.message }); }
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
                        transporter.use('compile', inLineCss());
    
                        let mailOptions = {
                            from: process.env.HOST_MAIL,
                            to: email,
                            subject: 'Gamanfy Staff',
                            html: `
                            <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
                <div> 
                    <p style='text-align:center'><b>¡Bienvenido!</b></p> 
                    <p>Estamos encantados de que formes parte de la comunidad Gamanfy.\n
                    <p>Gamanfy es la primera plataforma de selección de personal 2.0 que combina las nuevas tecnologías con un programa de referenciadores de candidatos externo elaborado por profesionales e influencers de talento ambos expertos en su sector.
                    <p><b>¿Empezamos?</b></p>
    
                    <a href="${process.env.PUBLIC_DOMAIN}/auth/login" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Acceder a mi cuenta</a><br/>
                 <p>Si tienes alguna duda, escríbenos a <b>info@gamanfy.com</b></p>
                </div>
                `,
                            attachments: [{
                                filename: 'Anotación 2020-07-30 172748.png',
                                path: 'public/Anotación 2020-07-30 172748.png',
                                cid: 'unique@nodemailer.com'
                            }]
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
    
            });
        });
    },

    resendToken : function (req, res, next) {

        const { email } = req.body;
    
        InfluencerUser.findOne({ email: req.body.email }, function (err, userinDB) {
            if (!userinDB) return res.status(404).send({ msg: 'We were unable to find a user with that email.' });
            if (userinDB.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
    
            const token = new UserToken({ _userId: userinDB._id, token: crypto.randomBytes(16).toString('hex') });
    
            token.save(function (err) {
                if (err) { return res.status(500).send({ msg: err.message }); }
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
                    transporter.use('compile', inLineCss());
    
                    let mailOptions = {
                        from: process.env.HOST_MAIL,
                        to: email,
                        subject: 'Verificación de la cuenta',
                        html:
                            `
                        <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
                        <div>
                            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${userinDB.firstName}! Nos alegramos mucho<br> de poder contar contigo </p>\n
          
                             <div style='font-weight:300; color:#535353; font-size:14px; margin:1.5em 0 1em 1em'>
                                 Tu cuenta ha sido creada y ya tienes todo listo para comenzar. </br>
                                 Haz click en este botón para verificar tu cuenta.</br>
                            </div>
                            <a href="${process.env.PUBLIC_DOMAIN}/auth/confirmation/${userinDB._id}/${token.token}/${userinDB.isCompany}" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:14em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Verificar cuenta</a><br/>
                        </div> \n`,
                        attachments: [{
                            filename: 'Anotación 2020-07-30 172748.png',
                            path: 'public/Anotación 2020-07-30 172748.png',
                            cid: 'unique@nodemailer.com'
                        }]
                    };
    
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) { return res.status(500).send({ msg: err.message }); }
                        else{
                            res.status(200).send('A verification email has been sent to ' + email + '.');
                        }
                    });
    
    
                } catch (error) {
                    next(error)
                }
    
            });
    
        });
    }

}

module.exports = user