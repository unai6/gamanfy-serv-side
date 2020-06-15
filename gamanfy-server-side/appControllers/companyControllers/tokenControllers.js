const CompanyToken = require('../../models/CompanyToken');
const Company = require('../../models/Company');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.confirmationToken = function (req, res, next) {

    const {token, email} = req.body;
    res
    .cookie(process.env.PUBLIC_DOMAIN, {
      maxAge: 432000000,
      httpOnly: true,
      secure: false,
      sameSite: true,
    })
    .status(200);
    
    CompanyToken.findOne(token, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });

        Company.findOne({ email: req.body.email, companyId: req.body.companyId }, function (err, companyinDB) {
            if (!companyinDB) return res.status(400).send({ msg: 'We were unable to find a Company for this token.' });
            if (companyinDB.isVerified) return res.status(400).send({ type: 'already-verified', msg: 'This Company has already been verified.' });

            companyinDB.isVerified = true;
            companyinDB.save(function (err) {
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

                    let mailOptions = {
                        from: process.env.HOST_MAIL,
                        to: email,
                        subject: 'Gamanfy Staff',
                        html: `
            <div> 
                <p>Thanks for registering in Gamanfy\n
            
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
        
        });
    });
};

exports.resendToken = function (req, res, next) {

    const {email} = req.body;
    
        Company.findOne({ email: req.body.email }, function (err, companyInDB) {
            if (!companyInDB) return res.status(404).send({ msg: 'We were unable to find a user with that email.' });
            if (companyInDB.isVerified) return res.status(400).send({ msg: 'This account has already been verified. Please log in.' });
    
            const token = new CompanyToken({ _companyId: companyInDB._id, token: crypto.randomBytes(16).toString('hex') });
    
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
    
                    let mailOptions = {
                        from: process.env.HOST_MAIL,
                        to: email,
                        subject: 'Account Verification Token',
                        text: `To validate your account \n Pleas click on the link: https://gamanfy-c2371.web.app/auth-co/confirmation/${token._companyId}/${token.token}\n`
                    };
    
                    transporter.sendMail(mailOptions, function (err) {
                        if (err) { return res.status(500).send({ msg: err.message }); }
                        res.status(200).send('A verification email has been sent to ' + email + '.');
                    });
    
    
                } catch (error) {
                    next(error)
                }
               
            });
    
        });
    }; 