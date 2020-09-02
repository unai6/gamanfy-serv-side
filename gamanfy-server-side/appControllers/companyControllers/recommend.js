const Company = require('../../models/Company');
const Recommended = require('../../models/Recommended');
const nodemailer = require('nodemailer');
let inLineCss = require('nodemailer-juice');

exports.recommend = async (req, res, next) => {

    try {
        const { recommendedEmail, recommendedFirstName, curriculum, recommendedLinkedin, recommendedPhoneNumber, recommendedLastName, whyRec, 
            specificEducation, howMet, sectorBestFit, departmentBestFit, competences, language, candidateLocation, otherAspects } = req.body;
        const { companyId } = req.params;
        await Company.findById(companyId);
        let recommendedProfessionals = await Recommended.create({ recommendedEmail, recommendedFirstName, curriculum, recommendedLinkedin, 
            recommendedPhoneNumber, recommendedLastName, whyRec,
            candidateInfo:{
            specificEducation, howMet, sectorBestFit, departmentBestFit, competences, language, candidateLocation, otherAspects} 
        });
        
        const updatedUser = await Company.findByIdAndUpdate(companyId, { $push: { recommendedProfessionals: recommendedProfessionals._id } }, { new: true })
        
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
        
          let mailOptionsToGamanfy = {
            from: process.env.HOST_MAIL,
            to: 'gamanfy@gmail.com',
            subject: 'Gamanfy, Recomendación de empresa',
            html: `
            <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
            <div>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> 
            La empresa con identificación : ${companyId} ha hecho una recomendacion de un candidato.
            Email del candidato : ${recommendedEmail}
            </p>\n
            </div>
            `,
            attachments: [{
                filename: 'Anotación 2020-07-30 172748.png',
                path: 'public/Anotación 2020-07-30 172748.png',
                cid: 'unique@nodemailer.com'
            }]
        }
        
        let mailOptions = {
            from: process.env.HOST_MAIL,
            to: recommendedEmail,
            subject: 'Gamanfy, ¡Te damos la bienvenida!',
            html: `
            <img style='height:6em'  src="cid:unique@nodemailer.com"/>
            
            <div style='width:35em; height:49.5em;'>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em; height:2em'> ¡Hola ${recommendedFirstName}! </p>\n
            <img  src="cid:naranjaabstract@naranja.com" style='height:6em; display:inline-block'/>

            <p style='text-align:center'><b>La empresa Desigual te ha recomendado como talento en nuestra plataforma de empleo.</b></p>
            
            <p>Una de nuestras empresas afiliadas ha pensado que eres una persona ideal para formar parte de nuestra plataforma.</p>
            
            <p>Regístrate en Gamanfy y te avisaremos de las próximas ofertas de empleo que te puedan interesar.</p>
            
            <p><b>¿Quiénes somos?</b></p>

            <p>Gamanfy es la primera solución que te permite recomendar a un profesional para una oferta de trabajo y cobrar por ello.</p>
            <p>¿Te gustaría transformarte tu también en un influencer de talento y desafiar el mercado laboral ahora?</p>
            <p>Crea tu cuenta de forma sencilla en menos de 2 minutos</p>
            
            <button type='submit' style="border:none; background-color:rgb(255,188,73); border-radius:5px; width:18.5em; height:3em; margin-top:2em; margin-left:9em"><a href='${process.env.PUBLIC_DOMAIN}/auth/user/signup' style='color:white; text-decoration:none; font-weight:500'>Crear mi cuenta</a></button><br/>
            
            </div>
            <img  src="cid:abstract@abstract.com" style='height:9em; display:inline-block'/>
           
            `,
            attachments: [
                {
                    filename: 'abstract-background_25-01.png',
                    path: 'public/abstract-background_25-01.png',
                cid: 'abstract@abstract.com'
            },
            {
                filename: 'Anotación 2020-07-30 172748.png',
                path: 'public/Anotación 2020-07-30 172748.png',
                cid: 'unique@nodemailer.com'
            },
            {
                filename: 'nranja.abstract-background_6-01.png',
                path: 'public/nranja.abstract-background_6-01.png',
                cid: 'naranjaabstract@naranja.com'
            }
        ]
    };
          
         transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); } else {
            res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
            }
        });
        
        transporter.sendMail(mailOptionsToGamanfy, function (err) {
            if (err) { return res.status(500).send({ msg: err.message }); } else {
              res.status(200).send('A verification recommendedEmail has been sent to ' + recommendedEmail + '.');
            }
        });
        res.status(200).send({ updatedUser })
          
    } catch (error) {
        res.status(400).send({ error: 'An error occurred while recommending user' })
    }
}