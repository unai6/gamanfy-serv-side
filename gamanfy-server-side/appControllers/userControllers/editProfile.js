const InfluencerUser = require('../../models/InfluencerUser');
const CompanyUser = require('../../models/CompanyUser');
const Address = require('../../models/Address');
const Sector = require('../../models/Sector');
const bcrypt = require("bcrypt");
const saltRounds = 10;



exports.editProfile = async (req, res, next) => {

    try {

        let { userId } = req.params;

        const isCompanyUser = await InfluencerUser.findById(userId).populate('companyUser');
        let { companyName, documentType, documentNumber, contactPerson, taxId, website, city, phoneNumber, numberOfEmployees,
            urlLinkedin, birthDate, hasExp, countryCode, countryName, provinceINEcode, municipalityINEcode,
            street, number, zip, invited, webCreated, province, municipality, sector, email, firstName, lastName, isCompany, isCandidate,
            yearsExp, actualPosition, yearsInPosition, actualCompany, profileDescription, actualSalary, password } = req.body;

        if (isCompanyUser.isCompany) {

            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);

            let addressId = await Address.findByIdAndUpdate(isCompanyUser.companyUser.addressId, {
                province, municipality, countryCode,
                countryName, provinceINEcode, municipalityINEcode, street, number, zip
            });

            let sectorId = await Sector.findByIdAndUpdate(isCompanyUser.companyUser.sectorId, { sector });

            let companyUser = await CompanyUser.findByIdAndUpdate(isCompanyUser.companyUser, {
                sectorId, addressId, phoneNumber, taxId, companyName, contactPerson, documentType, numberOfEmployees, documentNumber,
                website, city, countryName
            });

            let updatedUser = await InfluencerUser.findByIdAndUpdate(isCompanyUser, {
                companyUser, addressId, email, password: hashPass, firstName, lastName, phoneNumber
            });

            res.status(200).json({ message: 'company user updated correctly' });

        } else {
            let addressId = await Address.findByIdAndUpdate(isCompanyUser.addressId, {
                province, municipality, countryCode,
                countryName, provinceINEcode, municipalityINEcode, street, number, zip
            });
            const salt = bcrypt.genSaltSync(saltRounds);
            const hashPass = bcrypt.hashSync(password, salt);
            let updatedUser = await InfluencerUser.findByIdAndUpdate(isCompanyUser._id, {
                firstName, lastName, password: hashPass, birthDate, email, addressId,
                phoneNumber, countryName, city, urlLinkedin, isCompany, isCandidate, hasExp, yearsExp, actualPosition, yearsInPosition,
                actualCompany, profileDescription, actualSalary
            });

            res.status(200).json({ message: 'influencer user updated correctly' })

        };

    } catch (error) {
        res.status(400).json({ message: 'An error occured while editing user profile' });
    }

}