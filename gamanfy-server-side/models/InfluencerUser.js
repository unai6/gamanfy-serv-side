const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let uniqueValidator = require('mongoose-unique-validator');

const influencerUserSchema = new Schema({

    isVerified: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false },
    firstName: String,
    lastName: String,
    imageUrl: { type: String, required: true, default:'https://www.kindpng.com/picc/m/130-1300217_user-icon-member-icon-png-transparent-png.png'},
    birthDate: { type: Date },
    email: { type: String, required: [true, "Email is mandatory and unique"], unique: true },
    password: { type: String, require: [true, "password is mandatory"] },
    addressId: { type: Schema.Types.ObjectId, ref: 'Address' },
    phoneNumber: String,
    countryName: String,
    city: String,
    urlLinkedin: String,
    isCompany: { type: Boolean, default: false },
    isCandidate: { type: Boolean, default: false },
    companyUser: { type: Schema.Types.ObjectId, ref: 'CompanyUser' },
    candidateUser: { type: Schema.Types.ObjectId, ref: 'CandidateUser' },
    hasExp: { type: Boolean, default: false },
    yearsExp: String,
    actualPosition: String,
    yearsInPosition: String,
    actualCompany: String,
    profileDescription: String,
    actualSalary: String,
    recommended:{type:Schema.Types.ObjectId, ref:'Recommended'}

},

    {
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        }

    }
)

influencerUserSchema.methods.toJSON = function () {
    let user = this;
    let userObject = user.toObject();
    delete userObject.password;
    return userObject;
}

influencerUserSchema.plugin(uniqueValidator, {
    message: '{PATH} it has to be unique'
})


const InfluencerUser = mongoose.model("InfluencerUser", influencerUserSchema);

module.exports = InfluencerUser;