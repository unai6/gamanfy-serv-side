const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema  ({

      companyId : String,
      charge: String,
      description: String,
      jobPostDay : Date,
      jobDateOn : Date,
      jobDateOff : String

})




   const JobOffer = mongoose.model("JobOffer", jobOfferSchema);

module.exports = JobOffer;