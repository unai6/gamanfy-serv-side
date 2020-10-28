
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendedSchema = new Schema({
    moneyForRec:Number,
    recommendedBy:String,
    recommendationAccepted : {type: Boolean, default:false},
    recommendationRejected: {type: Boolean, default:false},
    recommendationValidated:{type: Boolean, default:false},
    inProcess : {type: Boolean, default:false},
    hired: {type: Boolean, default:false},
    stillInProcess: {type: Boolean, default:true},    
    offerId: {type: Schema.Types.ObjectId, ref:'JobOffer'},
    whyRec: String,
    recommendedFirstName: String,
    recommendedLastName: String,
    recommendedEmail: String,
    recommendedPhoneNumber:String,
    recommendedLinkedin : String,
    recommendedAge : String,
    curriculum: {type:String},
    howFoundCandidate : String,
    candidateInfo: {type:Object},
    recommendedByInfluencerPro : {type:Boolean, default:false}
 
},

    {
        timestamps: true
    })


const Recommended = mongoose.model("Recommended", recommendedSchema);

module.exports = Recommended;