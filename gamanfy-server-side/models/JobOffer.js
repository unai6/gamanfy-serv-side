const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema  ({

      scorePerRec : {type: String, default:'5'},
      moneyPerRec:String,
      contractServices : [{
            type:{type:String},
            sourcingWithInfluencer : {type:Boolean, default: false},
            exclusiveHeadHunter : {type:Boolean, default:false}
      }],
      additionalServices :[{
            type: {type:String},
            personalityTest:{type:Boolean, default: false},
            videoInterview : {type: Boolean, default: false},
            kitOnBoardgingGamanfy: {type: Boolean, default: false}
      }],
      gamanfyFee:[{
            type:{type:String},
            sourcingWithInfluencer:{type:String},
            exclusiveHeadHunter:{type:String},
            personalityTest:{type:String},
            videoInterview: {type:String},
            kitOnBoardgingGamanfy:{type:String},
            totalFee:{type:String}
      }],

      companyId : String,
      charge: String,
      description: String,
      jobPostDay : Date,
      jobDateOn : Date,
      jobDateOff : String

})




   const JobOffer = mongoose.model("JobOffer", jobOfferSchema);

module.exports = JobOffer;