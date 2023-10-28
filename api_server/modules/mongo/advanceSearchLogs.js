const mongoose = require('mongoose');
const moment = require('moment');

const advanceSearchFilterLogSchema = new mongoose.Schema({
    studentId: { type: String, index: true, required: true },
    questionId: { type: String, index: true, required: true },
    viewId: { type: String, index: true, required: true },
    filters: { type: mongoose.Schema.Types.Mixed, index: true, required: true },
    page: { type: mongoose.Schema.Types.String },
    source: { type: [mongoose.Schema.Types.String] },
    createdAt: { type: Date },
}, {
    timestamps: true,
});

const Model = mongoose.model('advance_search_logs', advanceSearchFilterLogSchema);

advanceSearchFilterLogSchema.on('index', (error) => {
    console.error(error.message);
});

advanceSearchFilterLogSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = Model;
