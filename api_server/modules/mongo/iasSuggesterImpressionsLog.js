const mongoose = require('mongoose');

const { Schema } = mongoose;
const iasSuggesterImpressionsLogSchema = new Schema({
    result_string: { type: String, index: true, required: true },
    view_count: { type: Number, default: 1 },
    clicked_count: { type: Number, default: 0 },
}, {
    timestamps: true,
});

const iasSuggesterImpressionsLogModel = mongoose.model('iasSuggesterImpressionsLog', iasSuggesterImpressionsLogSchema);
iasSuggesterImpressionsLogModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = iasSuggesterImpressionsLogModel;
