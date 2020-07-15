const UserToken = require('../../models/UserToken');
const InfluencerUser = require('../../models/InfluencerUser');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.confirmationToken = function (req, res, next) {
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

                    let mailOptions = {
                        from: process.env.HOST_MAIL,
                        to: email,
                        subject: 'Gamanfy Staff',
                        html: `
            <div> 
                <p>¡Bienvenido! Muchas gracias por registrarse en Gamanfy para poder ver las mejores ofertas.\n
            
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

                let mailOptions = {
                    from: process.env.HOST_MAIL,
                    to: email,
                    subject: 'Account Verification Token',
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
                        filename: 'logo-gamanfy-email.png',
                        path: 'public/logo-gamanfy-email.png',
                        cid: 'unique@nodemailer.com'
                    }]
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