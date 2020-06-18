
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const killerqSchema = new Schema({


},

    {
        timestamps: true
    })


const KillerQ = mongoose.model("KillerQ", killerqSchema);

module.exports = KillerQ;