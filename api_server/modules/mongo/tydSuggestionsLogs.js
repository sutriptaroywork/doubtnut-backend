const mongoose = require('mongoose');
const moment = require('moment');

const tydSuggestionsLogsSchema = new mongoose.Schema({
    studentId: { type: Number, index: true, required: true },
    class: { type: Number, index: true },
    locale: { type: String, index: true },
    ocrText: String,
    matches: [String],
    isVoiceSearch: { type: Boolean, index: true },
    queryOcrText: String,
}, {
    timestamps: true,
});

const Model = mongoose.model('tyd_suggestions_logs', tydSuggestionsLogsSchema);

tydSuggestionsLogsSchema.on('index', (error) => {
    console.error(error.message);
});

tydSuggestionsLogsSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = Model;
