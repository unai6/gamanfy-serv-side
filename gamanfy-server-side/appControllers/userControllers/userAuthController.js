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
          isVerified: user.isVerified
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
    let { isaCompany, userId } = req.params;

    const { companyName, documentType, documentNumber, contactPerson, taxId, website, city, phoneNumber, numberOfEmployees,
      urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
      street, number, zip, invited, webCreated, province, municipality } = req.body;

    const checkUser = await InfluencerUser.findById(userId);
    isaCompany = checkUser.isCompany

    let addressId = await Address.create({
      province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip
    });

    let sectorId = await Sector.create(req.body);
    if (checkUser.isCompany) {
      const companyUser = await CompanyUser.create({
        sectorId, addressId, phoneNumber, taxId, companyName, contactPerson,
        documentType, numberOfEmployees, documentNumber, website, city, countryName
      });

      const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { companyUser, addressId }, { new: true });
      res.status(200).json({ updatedUser });


    } else if (checkUser.isCompany === false) {
      const updatedUser = await InfluencerUser.findByIdAndUpdate(checkUser, { addressId, city, phoneNumber, urlLinkedin, birthDate, hasExp }, { new: true });
      res.status(200).json({ updatedUser });

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
        to: newUser.email,
        subject: 'Account Verification Token',
        text: `Welcome to Gamanfy ${newUser.firstName}.\n Please verify your account by clicking the link:  ${process.env.PUBLIC_DOMAIN}/auth/confirmation/${newUser._id}/${token.token}/${newUser.isCompany}\n`
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