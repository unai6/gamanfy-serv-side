const nodemailer = require('nodemailer');
const Company = require('../../models/Company');

exports.sendMail =  async (req, res, next) => {
   
    try {
        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
        const {header, description} = req.body

        let transporter =  nodemailer.createTransport({

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
            from: checkCompany.email,
            to: process.env.HOST_MAIL,
            subject: header,
            text: description
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

}