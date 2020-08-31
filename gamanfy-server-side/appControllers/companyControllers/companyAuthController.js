const CompanyToken = require('../../models/CompanyToken');
const Company = require('../../models/Company');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');
const bcrypt = require("bcrypt");
const { signToken } = require('../../helpers/signToken');
const saltRounds = 10;
const nodemailer = require('nodemailer');
const crypto = require('crypto');
let inLineCss = require('nodemailer-juice');

exports.companyLogin = async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    let user = await Company.findOne({ email });

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
      })
        .status(200)

      const token = signToken(user, remember);
      res.status(200).json({
        token,
        user: {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          isVerified: user.isVerified,
          isCompleted: user.isCompleted,
          isItaCompany: true
        }
      });

    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Server error" });
  }
}

exports.companyCompleteProfile = async (req, res, next) => {

  try {

    const { companyId } = req.params;
    const checkCompany = await Company.findById(companyId);
    const { contactPerson, description, city, companyName, taxId, countryCode, countryName,
      provinceINEcode, municipalityINEcode, street, number, zip, province, municipality, website, phoneNumber, numberOfEmployees } = req.body;
    let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, province, municipality, street, number, zip });
    let sectorId = await Sector.create(req.body);

    res.cookie(process.env.PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN, {
      maxAge: 432000000,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    })
      .status(200)

    const token = signToken(checkCompany)

    const updatedCompany = await Company.findByIdAndUpdate(checkCompany, {
      city, countryName, contactPerson, description,
      companyName, sectorId, taxId, addressId, website, phoneNumber, numberOfEmployees, isCompleted: true
    }, { new: true });
    res.status(200).json({
      updatedCompany, token,
      user: {
        userId: checkCompany.id,
        email: checkCompany.email,
        firstName: checkCompany.firstName,
        isVerified: checkCompany.isVerified,
        isCompleted: checkCompany.isCompleted
      }
    });


  } catch (error) {
    res.status(400).json({ error: 'An error occured while completing company profile' })
  }
}

exports.companySignUp = async (req, res, next) => {

  let { firstName, lastName, email, password, companyName, isHeadHunter, termsAccepted } = req.body;


  try {
    const emailExists = await Company.findOne({ email }, 'email');
    if (emailExists) {

      return res.json('email already exists in DB');

    } else if (isHeadHunter === 'on') {
      isHeadhunter = true

    } else {

      const salt = bcrypt.genSaltSync(saltRounds);
      const hashPass = bcrypt.hashSync(password, salt);
      const newCompany = await Company.create({ firstName, lastName, email, password: hashPass, companyName, isHeadHunter, termsAccepted });
      const token = new CompanyToken({ _companyId: newCompany._id, token: crypto.randomBytes(16).toString('hex') });
      token.save(function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
      });

      res
        .cookie(process.env.PUBLIC_DOMAIN, {
          maxAge: 432000000,
          httpOnly: true,
          secure: false,
          sameSite: true,
        })
        .status(200)

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
        html: `
        <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
        <div>
            <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${newCompany.firstName}! Nos alegramos mucho<br> de poder contar contigo </p>\n

             <div style='font-weight:300; color:#535353; font-size:14px; margin:1.5em 0 1em 1em'>
                 Tu cuenta ha sido creada y ya tienes todo listo para comenzar. </br>
                 Haz click en este botón para verificar tu cuenta.</br>
            </div>
            <a href="${process.env.PUBLIC_DOMAIN}/auth-co/confirmation/${newCompany._id}/${token.token}" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:14em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Verificar cuenta</a><br/>
        </div> \n`,
        attachments: [{
          filename: 'logo-gamanfy-email.png',
          path: 'public/logo-gamanfy-email.png',
          cid: 'unique@nodemailer.com'
        }]
      };


      transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.status(200).send('A verification email has been sent to ' + newCompany.email + '.');
      });

      res.status(200).json(newCompany);

    }
  } catch (error) {
    next(error);
  };
}

exports.resetPasswordRoute = async (req, res) => {

  try {
    const {email} = req.body;
  
    const company = await Company.findOne({ email }, 'email')

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
      to: company.email,
      subject: ` Reset password ${company.companyName}`,
      html: `
      <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
      <div>
          <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${company.companyName}! </p>\n

           <div style='font-weight:300; color:#535353; font-size:14px; margin:1.5em 0 1em 1em'>
               Haz click en el botón para restablecer tu contraseña. </br>
               
          </div>
          <a href="${process.env.PUBLIC_DOMAIN}/auth-co/company/password-reset/${company._id}" style="color:white; text-decoration:none; border:none !important; background-color:rgb(255,188,73); border-radius:5px; width:14em; padding:.2em .5em .2em .5em; height:2.5em; margin-top:2em; margin-left:11em; font-weight:500">Haz click aquí</a><br/>
      </div> \n`,
      attachments: [{
        filename: 'logo-gamanfy-email.png',
        path: 'public/logo-gamanfy-email.png',
        cid: 'unique@nodemailer.com'
      }]
    };

    transporter.sendMail(mailOptions, function (err) {
      if (err) { return res.status(500).send({ msg: err.message }); }
      res.status(200).send('A verification email has been sent to ' + company.email + '.');
    });
    
  } catch (error) {
    res.send(error)
  }

}

exports.passwordReset = async (req, res, next) => {


  try {
    const { companyId } = req.params.companyId;

    const company = await Company.findById(companyId);

    const { password } = req.body;

    const updatedCompany = await Company.findByIdAndUpdate(company, { password });

    res.status(200).json({ updatedCompany })

  } catch (error) {
    next(error)
  }
};

exports.getCompanyData = async (req, res) => {

  try {
    const { companyId } = req.params;

    let getCompanyData = await Company.findById(companyId);

    res.status(200).json(getCompanyData);

  } catch (error) {
    res.status(400).json({ mssg: 'error' })
  }

};

exports.companyLogout = async (req, res, next) => {
  try {
    res.clearCookie(process.env.PUBLIC_DOMAIN);
    res.status(200).json({ msg: "Log out sucesfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Server error" });
  }
  return;
};