const mongoose = require('mongoose');


const SummarySchema = new mongoose.Schema({

});


const Summary = mongoose.model('Summary', SummarySchema);
module.exports = Summary;