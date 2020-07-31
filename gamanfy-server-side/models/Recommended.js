
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendedSchema = new Schema({
    moneyForRec:Number,
    recommendationAccepted : {type: Boolean, default:true},
    recommendationRejected: {type: Boolean, default:false},
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
    curriculum: String,
    howFoundCandidate : String,
    candidateInfo: {type:Object},
 
},

    {
        timestamps: true
    })


const Recommended = mongoose.model("Recommended", recommendedSchema);

module.exports = Recommended;