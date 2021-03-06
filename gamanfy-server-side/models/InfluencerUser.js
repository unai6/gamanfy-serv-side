const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let uniqueValidator = require('mongoose-unique-validator');

const influencerUserSchema = new Schema({
    
    isVerified: { type: Boolean, default: false },
    termsAccepted: {type:Boolean, default:false},
    influencerUserPunctuation : {type:Number, default:100},
    isCompleted: { type: Boolean, default: false },
    firstName: String,
    lastName: String,
    imageUrl: { type: String, required: false},
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
    recommendedPeople:[{type:Schema.Types.ObjectId, ref:'Recommended'}],
    historicRecommendations:[{type:Schema.Types.ObjectId, ref:'Recommended'}],
    curriculum: {type:String},
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
    message: ' it has to be unique'
})


const InfluencerUser = mongoose.model("InfluencerUser", influencerUserSchema);

module.exports = InfluencerUser;