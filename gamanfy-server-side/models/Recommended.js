
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendedSchema = new Schema({
    recommendationAccepted : {type: Boolean, default:false},
    recommendationRejected: {type: Boolean, default:false},
    inProcess : {type: Boolean, default:false},
    hired: {type: Boolean, default:false},
    stillInProcess: {type: Boolean, default:true},    
    offerId: {type: Schema.Types.ObjectId, ref:'JobOffer'},
    whyRec : String,
    recommendedFirstName: String,
    recommendedLastName: String,
    recommendedEmail: String,
    recommendedPhoneNumber:String,
    recommendedLinkedin : String,
    curriculum: String,
    howFoundCandidate : String,
    candidateInfo: {type:Object},
    moneyForRec:{type:Number}
 
},

    {
        timestamps: true
    })


const Recommended = mongoose.model("Recommended", recommendedSchema);

module.exports = Recommended;