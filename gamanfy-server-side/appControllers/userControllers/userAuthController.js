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

exports.login = async (req, res) => {
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
          isCompleted: user.isCompleted
        }
      });

    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: "Server error" });
  }
}

exports.userCompleteProfile = async (req, res) => {

  try {
    let { userId } = req.params;

    const { companyName, documentType, documentNumber, contactPerson, taxId, website, city, phoneNumber, numberOfEmployees,
      urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
      street, number, zip, invited, webCreated, province, municipality, isCompleted } = req.body;

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

      const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { companyUser, addressId, isCompleted }, { new: true });
      res.status(200).json({
        updatedUser, token,
        user: {
          userId: checkUser.id,
          email: checkUser.email,
          firstName: checkUser.firstName,
          isVerified: checkUser.isVerified,
          isCompleted: checkUser.isCompleted
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
      const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { addressId, city, phoneNumber, urlLinkedin, birthDate, hasExp, isCompleted }, { new: true });
      res.status(200).json({
        updatedUser, token,
        user: {
          userId: checkUser.id,
          email: checkUser.email,
          firstName: checkUser.firstName,
          isVerified: checkUser.isVerified,
          isCompleted: checkUser.isCompleted
        }
      });

    } else if (checkUser.isCandidate) {
      const candidateUser = await CandidateUser.create({ invited, webCreated });
      await InfluencerUser.findByIdAndUpdate(checkUser, { candidateUser }, { new: true });
      res.status(200).json({ candidateUser });
    };

  } catch (error) {
    res.status(400).json({ error: 'An error ocurred while saving data' })
  }

}


exports.userSignup = async (req, res, next) => {

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
        to: newUser.email,
        subject: 'Verificación de la Cuenta',
        html: `
          <img style='height:6em' <img src="cid:unique@nodemailer.com"/>
          <div>
          <p style='font-weight:600; color:#535353; font-size:18px; margin-left:1em'> ¡Hola ${newUser.firstName}! Nos alegramos mucho<br> de poder contar contigo </p>\n
      
            <div style='font-weight:300; color:#535353; font-size:14px; margin-top:1.5em'>
              Tu cuenta ha sido creada y ya tienes todo listo para comenzar. </br>
              Haz click en este botón para verificar tu cuenta.</br>
            </div>
              <button type='submit' style='border:none; background:rgb(255,188,73); border-radius:5px; width:14em; height:2.5em; margin-top:2em; margin-left:11em'><a href="${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}" style="color:white; text-decoration:none; font-weight:500">Verificar cuenta</a></button><br/>
          </div> \n`,
        attachments: [{
          filename: 'logo-gamanfy-email.png',
          path: 'public/logo-gamanfy-email.png',
          cid: 'unique@nodemailer.com'
        }]
      };

      transporter.sendMail(mailOptions, function (err) {
        if (err) { return res.status(500).send({ msg: err.message }); }
        res.status(200).send('A verification email has been sent to ' + newUser.email + '.');
      });
      console.log(newUser.firstName)
      res.status(200).json(newUser);

    }
  } catch (error) {
    next(error);
  };

}