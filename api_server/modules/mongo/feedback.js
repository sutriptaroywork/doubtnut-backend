const mongoose = require('mongoose');
const moment = require('moment');

const types = mongoose.Schema.Types;

const FeedbackSchema = new mongoose.Schema({
    student_id: { type: String, index: true, required: true },
    question_id: { type: String, index: true, required: true },
    source: { type: String },
    is_positive: { type: Boolean },
    feedback: { type: String },
    meta: { type: types.Mixed },
    event: { type: String },
}, {
    timestamps: true,
});
FeedbackSchema.pre('save', (next) => {
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

const FeedbackModel = mongoose.model('feedback', FeedbackSchema);
FeedbackModel.on('index', (error) => {
    console.error(error.message);
});

module.exports = FeedbackModel;
