const mongoose = require('mongoose');
const moment = require('moment');

const { Schema } = mongoose;
const CommentSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    student_username: { type: String, index: true, required: true },
    student_avatar: { type: String },
    question_id: { type: String, index: true },
    answer_id: { type: String },
    entity_type: { type: String, index: true, required: true },
    entity_id: { type: String, index: true, required: true },
    message: { type: String, trim: true, default: '' },
    original_message: { type: String, trim: true, default: '' },
    parent_id: { type: String, index: true, default: null },
    image: { type: String, default: '' },
    audio: { type: String, default: '' },
    // is_reported: {type: String, index: true},
    reported_by: { type: [Number], index: true },
    liked_by: { type: [Number], index: true },
    replies_count: { type: Number, default: 0 },
    is_deleted: { type: Boolean, index: true, default: false },
    is_profane: { type: Boolean, index: true, default: false },
    is_admin: { type: Boolean },
    user_tag: { type: String },
    is_doubt: { type: Boolean },
    offset: { type: Number },
    is_answer: { type: Boolean },
    is_top_doubt: { type: Boolean },
    batch_id: { type: Number },
    suggested_id: { type: String },
}, {
    timestamps: true,
});
CommentSchema.pre('save', function (next) {
    // this._update.updated_at *= 1000;
    console.log('this');
    console.log(this);
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});
const CommentModel = mongoose.model('Comment', CommentSchema);
CommentModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = CommentModel;
