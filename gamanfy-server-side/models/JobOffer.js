const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema([{
      scorePerRec: { type: String, default: '20' },
      moneyPerRec: String,
      offerPicture:{type:String, default:'https://image.flaticon.com/icons/svg/2472/2472458.svg'},
      companyData: { type: Object, required: true },
      jobOfferData: { type: Object, required: true },
      jobDescription: {type:Object, required:true},
      benefits:{type:Object},
      showMoney:{type:Boolean, default: false, required:true},
      companyThatOffersJob: {type: Schema.Types.ObjectId, ref: 'Company', required: true },
      addressId: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
      sectorId: { type: Schema.Types.ObjectId, ref: 'Sector', required: true },
      categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
      contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true },
      retribution: { type: Object, required: true },
      minRequirements: { type: Object, required: true },
      manager: { type: Object, required: true },
      keyCompetences: { type: Object, required: true },
      keyKnowledge : {type:Object, required: true},
      recommendedTimes : Array
}],
{
      timestamps: {
          createdAt: 'createdAt',
          updatedAt: 'updatedAt'
      }

  })




const JobOffer = mongoose.model("JobOffer", jobOfferSchema);

module.exports = JobOffer;



