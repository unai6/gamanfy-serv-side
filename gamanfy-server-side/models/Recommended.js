
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recommendedSchema = new Schema({
    recommendationAccepted : {type: Boolean, default:false},
    inProcess : {type: Boolean, default:false},
    hired: {type: Boolean, default:false},
    offerId: {type: Schema.Types.ObjectId, ref:'JobOffer'},
    whyRec : String,
    recommendedFirstName: String,
    recommendedLastName: String,
    recommendedEmail: String
},

    {
        timestamps: true
    })


const Recommended = mongoose.model("Recommended", recommendedSchema);

module.exports = Recommended;