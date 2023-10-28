const mongoose = require('mongoose');

const { Schema } = mongoose;
const iasSuggestionLogSchema = new Schema({
    studentId: { type: String, index: true, required: true },
    studentClass: { type: String, index: true, required: true },
    id: { type: String, default: '' },
    searchText: { type: String },
    size: { type: Number },
    data: { type: String, default: '' },
    position: { type: Number },
    ias_suggestion_iteration: { type: String, default: '' },
}, {
    timestamps: true,
});

const iasSuggestionModel = mongoose.model('iasSuggestionLogs', iasSuggestionLogSchema);
iasSuggestionModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = iasSuggestionModel;
