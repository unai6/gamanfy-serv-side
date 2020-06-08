const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({

employee:String,
specialist: String,
intermediateResp: String,
Direction:String,
DirectiveCouncil: String,
Cofounder:String

},

    {
        timestamps: true
    })


const Category = mongoose.model("Category", categorySchema);

module.exports = Category;