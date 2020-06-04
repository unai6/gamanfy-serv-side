const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const candidateUserSchema = new Schema  ({

        invited:{type:Boolean, default:false},
        webCreated:{type:Boolean, default:false},

})




   const CandidateUser = mongoose.model("CandidateUser", candidateUserSchema);

module.exports = CandidateUser;