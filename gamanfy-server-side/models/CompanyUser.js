const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companyUserSchema = new Schema({
    companyName: String,
    companyUserPunctuation: {type:Number, default:500},
    taxId: String,
    countryName: String,
    city: String,
    phoneNumber: String,
    addressId: { type: Schema.Types.ObjectId, ref: 'Address'    },
    documentType: String,
    documentNumber: String,
    numberOfEmployees: String,
    contactPerson: String,
    phoneNumber: String,
    website: String,
    description: String,
    sectorId: { type: Schema.Types.ObjectId, ref: 'Sector' }
},
    {
        timestamps: true
    }
)




const CompanyUser = mongoose.model("CompanyUser", companyUserSchema);

module.exports = CompanyUser;