const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema  ([{
      scorePerRec : {type: String, default:'5'},
      moneyPerRec:String,
      contractServices: {type: Object, required:true},
      additionalServices:{type: Object, required:true},
      gamanfyFee:{type: Object, required:true},
      companyData:{type: Object, required:true},
      jobOfferData:{type:Object, required:true},
      addressId: {type: Schema.Types.ObjectId, ref: 'Address', required:true},
      sectorId: {type: Schema.Types.ObjectId, ref: 'Sector', required:true},
      categoryId:{type: Schema.Types.ObjectId, ref: 'Category', required:true},
      contractId:{type: Schema.Types.ObjectId, ref: 'Contract', required:true},
      retribution:{type:Object, required:true},
      minRequirements:{type:Object, required:true},
      keyCompetences:{type:Object, required:true},
      videoInterviewQuestions:{type:Object, required:true}
}])




   const JobOffer = mongoose.model("JobOffer", jobOfferSchema);

module.exports = JobOffer;


/* 
scorePerRec : {type: String, default:'5'},
      moneyPerRec:String,
      contractServices : [{
            
            sourcingWithInfluencer : {type:Boolean, default: false},
            exclusiveHeadHunter : {type:Boolean, default:false}
      }],
      additionalServices :[{
            type: {type:String},
            hasPersonalityTest:{type:Boolean, default: false},
            hasVideoInterview : {type: Boolean, default: false},
            hasVitOnBoardgingGamanfy: {type: Boolean, default: false}
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

      companyData:[{
            type:{type:String},
            processNum: String,
            description:String,
            website:String,
            recruiter:String,
      }],

      jobOfferData:[{
            type:{type:String},
            jobName:{type:String},
            onDate: {type:String},
            offDate: {type:String},
            processState: {type:Boolean, default: false},
            jobAddress:{type:String},
            isRemote:{type:Boolean, default:false},
            sector:{type:Schema.Types.ObjectId, ref:'Sector'},
            category:{type:Schema.Types.ObjectId, ref:'Category'},
            personsOnCharge: {type:String},
            contractType: {type:Schema.Types.ObjectId, ref:'Contract'},     
            jobDescription:[{
                  type:{type: String},
                  mainMission: String,
                  jobDescription:String,
                  team:String
            }],
            manager:[{
                  type:{type: String},
                  managerDescription:String,
                  managerName: String
            }],

            killerQuestions: {type:Schema.Types.ObjectId, ref:'KillerQ'}
            
      }],

      retribution:[{
            type:{type:String},
            minGrossSalary:{type:String},
            maxGrossSalary:{type:String},
            variableRetribution:{type:Boolean, default:false},
            quantityVariableRetribution: {type:String},
            showMoney:{type:Boolean, default:false},
            socialBenefits:{type:Schema.Types.ObjectId, ref:'SBenefits'}
      }],

      minRequirements:[{
            minExp: String,
            minStudies: String,
            keyKnowledge: String,
            keyCompetences: String,
            minReqDescription: String,
            Language:String,
            LangugageLevel: String
      }],

      videoInterviewQuestions:[{
            type:{type:String},
            question1:{type:String},
            question2:{type:String},
            question3:{type:String},
            question4:{type:String},
            question5:{type:String},
      }] */

