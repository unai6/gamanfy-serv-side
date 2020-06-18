const Company = require('../../models/Company');
const Sector = require('../../models/Sector');
const Address = require('../../models/Address');

exports.editProfile = async (req, res, next) => {


    try {

        const { companyId } = req.params;
        const checkCompany = await Company.findById(companyId);
        let { sector, province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip,
            isHeadHunter, companyName, firstName, lastName, email, password, city, phoneNumber, taxId, contactPerson,
            website, numberOfEmployees, description } = req.body;
        const salt = bcrypt.genSaltSync(saltRounds);
        const hashPass = bcrypt.hashSync(password, salt);

        let addressId = await Address.findByIdAndUpdate(checkCompany.addressId, { province, municipality, countryCode, countryName, provinceINEcode, municipalityINEcode, street, number, zip }, { new: true });
        let sectorId = await Sector.findByIdAndUpdate(checkCompany.sectorId, { sector }, { new: true });

        let updatedCompany = await Company.findByIdAndUpdate(checkCompany._id, {
            addressId, sectorId, isHeadHunter, companyName, firstName,
            lastName, email, password: hashPass, countryName, city, phoneNumber, taxId, contactPerson,
            website, numberOfEmployees, description
        }, { new: true });



        res.status(200).json({ updatedCompany });


    } catch (error) {
        res.status(400).json({ error: 'An error occurred while saving company data' });
    }
}