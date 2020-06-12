
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contractSchema = new Schema({
    contract: String

},

    {
        timestamps: true
    })


const Contract = mongoose.model("Contract", contractSchema);


/* Tipos de contrato 
   
   autonomo: String,
   contratoDeDuraciónDeterminada:String,
   deRelevo: String,
   fijoDiscontinuo: String,
   formativo:String,
   Indefinido:String,
   aTiempoParcial:String,
   otrosContratos:String */
module.exports = Contract;