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

      companyData:[{
            type:{type:String},
            processNum: String,
            description:String,
            website:String,
            recruiter:String,
      }],

      jobOfferData:[{
            type:{type:String},
            name:{type:String},
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
                  mainMission: String,
                  jobDescription:String,
                  team:String
            }],
            manager:[{
                  managerDescription:String,
                  managerName: String
            }],

            killerQuestions: {type:Schema.Types.ObjectId, ref:'Contract'}
            
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

      }]


})




   const JobOffer = mongoose.model("JobOffer", jobOfferSchema);

module.exports = JobOffer;