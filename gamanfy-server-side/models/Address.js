const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new Schema({

    countryCode: String,
    countryName:String,
    cityForOffer:String,
    provinceINEcode: String,
    municipalityINEcode: String,
    street: String,
    number: String,
    zip: String,
    province: String,
    municipality: String
},

    {
        timestamps: true
    })


const Address = mongoose.model("Address", addressSchema);

module.exports = Address;

/*    province: [{
       type:{ type: String},
       provinceName: {type: String}, 
       provinceCode: {type: String},
    }], 
    
      municipality: [{
        type: {type: String},
        municipalityCode: {type: String },
        municipalityDescription: {type: String}
    }]
},*/