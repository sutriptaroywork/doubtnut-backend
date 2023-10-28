const mongoose = require('mongoose');
const moment = require('moment');

const ScheduledPdfSchema = new mongoose.Schema({
    source: { type: String, index: true, required: true },
    phone: { type: String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    questionId: { type: mongoose.Schema.Types.Number, index: true, required: true },
    results: { type: [mongoose.Schema.Types.String] },
    createdAt: { type: Date },
}, {
    timestamps: true,
});

const ScheduledPdfModel = mongoose.model('scheduled_pdf', ScheduledPdfSchema);

ScheduledPdfSchema.on('index', (error) => {
    console.error(error.message);
});

ScheduledPdfSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = ScheduledPdfModel;
