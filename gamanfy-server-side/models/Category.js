const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    
    category:String,

},

{
    timestamps: true
    })
    
    
    const Category = mongoose.model("Category", categorySchema);
    
    module.exports = Category;


    /*
    Tipos de categoria
    
    employee:String,
    specialist: String,
    intermediateResp: String,
    direction:String,
    directiveCouncil: String,
    cofounder:String*/