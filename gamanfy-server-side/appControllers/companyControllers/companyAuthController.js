const Company = require('../../models/Company');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');
const bcrypt = require("bcrypt");
const { signToken } = require('../../helpers/signToken');
const jwt = require('jsonwebtoken');

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
          isCompleted: user.isCompleted
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
    const { isCompleted, yearsExp, contactPerson, description, city, companyName, taxId, countryCode, countryName,
      provinceINEcode, municipalityINEcode, street, number, zip, province, municipality, website, phoneNumber, numberOfEmployees } = req.body;
    let addressId = await Address.create({ countryCode, countryName, provinceINEcode, municipalityINEcode, province, municipality, street, number, zip });
    let sectorId = await Sector.create(req.body);
    checkCompany.isCompleted = true;


    res.cookie(process.env.PUBLIC_DOMAIN || process.env.PUBLIC_DOMAIN, {
      maxAge: 432000000,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    })
      .status(200)

    const token = signToken(checkCompany)
    
    const updatedCompany = await Company.findByIdAndUpdate(checkCompany, {
      yearsExp, city, countryName, contactPerson, description,
      companyName, sectorId, taxId, addressId, website, phoneNumber, numberOfEmployees, isCompleted
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