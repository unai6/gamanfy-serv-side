const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let uniqueValidator = require('mongoose-unique-validator');


const companySchema = new Schema({

  isVerified: { type: Boolean, default: false },
  isHeadHunter: { type: Boolean, default: false },
  companyName: String,
  firstName:String,
  lastName:String,
  email: { type: String, required: [true, "Email is mandatory and unique"], unique: true },
  password: { type: String, require: [true, "password is mandatory"] },
  sectorId: { type: Schema.Types.ObjectId, ref: 'Sector' },
  addressId: {type: Schema.Types.ObjectId, ref: 'Address'},
  postedOffers : [{ type:Schema.Types.ObjectId, ref:'JobOffer'}],
  countryName:String,
  city: String, 
  phoneNumber:String,
  taxId: String,
  contactPerson: String,
  yearsExp: String,
  website: String,
  numberOfEmployees: String,
  description:String,
},

  {

    timestamps: {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    }
  }
);

companySchema.methods.toJSON = function () {
  let company = this;
  let companyObject = company.toObject();
  delete companyObject.password;
  return companyObject;
}

companySchema.plugin(uniqueValidator, {
  message: '{PATH} it has to be unique'
})

const Company = mongoose.model("Company", companySchema);

module.exports = Company;


