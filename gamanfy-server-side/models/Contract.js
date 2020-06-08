
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const contractSchema = new Schema({

    autonomo: String,
    contratoDeDuraciónDeterminada:String,
    deRelevo: String,
    fijoDiscontinuo: String,
    formativo:String,
    Indefinido:String,
    aTiempoParcial:String,
    otrosContratos:String

},

    {
        timestamps: true
    })


const Contract = mongoose.model("Contract", contractSchema);

module.exports = Contract;