const UserToken = require('../../models/UserToken');
const InfluencerUser = require('../../models/InfluencerUser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.confirmationToken = function (req, res, next) {
    const {token, email} = req.body
    UserToken.findOne(token, function (err, token) {
        if (!token) return res.status(400).send({ type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.' });
        console.log(token)
        
        InfluencerUser.findOne({ email: req.body.email, userId: req.body.userId }, function (err, userinDB) {
            res
                .cookie(process.env.PUBLIC_DOMAIN, {
                  maxAge:  432000000,
                  httpOnly: true,
                  sameSite: 'none',
                  secure: true,
                })
                .status(200); 

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

                let mailOptions = {
                    from: process.env.HOST_MAIL,
                    to: email,
                    subject: 'Account Verification Token',
                    text: `To validate your account \n Pleas click on the link: https://gamanfy-c2371.web.app/auth/confirmation/${token._userId}/${token.token}\n`
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