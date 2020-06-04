const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const companyTokenSchema = new Schema({
    _companyId: { type: Schema.Types.ObjectId, required: true, ref: 'Company' },
    token: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 43200 }
});

const CompanyToken = mongoose.model("CompanyToken", companyTokenSchema);

module.exports = CompanyToken