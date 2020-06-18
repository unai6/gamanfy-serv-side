exports.sendMail =  (req, res, next) => {
    const { companyName, businessName, phoneNumber, message, email } = req.body;

    try {

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

}