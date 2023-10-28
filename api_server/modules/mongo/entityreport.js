/*
* @Author: Xesloohc
* @Date:   2018-12-26 16:56:56
* @Last Modified by:   XesLoohc
* @Last Modified time: 2018-12-26 18:25:49
*/
const mongoose = require('mongoose');
const moment = require('moment');

const { Schema } = mongoose;
const EntityReportSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    student_username: { type: String, index: true, required: true },
    student_avatar: { type: String },
    entity_type: { type: String, index: true, required: true },
    entity_id: { type: String, index: true, required: true },
    message: { type: String },
    is_moderated: { type: Boolean, default: false },
    is_deleted: { type: Boolean, index: true, default: false },
}, {
    timestamps: true,
});
const EntityReportModel = mongoose.model('EntityReport', EntityReportSchema);
EntityReportModel.on('index', (error) => {
    console.log(error.message);
});
EntityReportSchema.pre('save', function (next) {
    // this._update.updated_at *= 1000;
    console.log('this');
    console.log(this);
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});
module.exports = EntityReportModel;
