const mongoose = require('mongoose');
const moment = require('moment');

const multipleDeviceVideoBlockUserLogSchema = new mongoose.Schema({
    studentId: { type: String, index: true, required: true },
    questionId: { type: String, index: true, required: true },
    blockedUdid: { type: String, index: true, required: true },
    activeUdid: { type: mongoose.Schema.Types.String, index: true, required: true },
    page: { type: mongoose.Schema.Types.String },
    source: { type: [mongoose.Schema.Types.String] },
    createdAt: { type: Date },
}, {
    timestamps: true,
});

const Model = mongoose.model('multiple_device_video_block_user_logs', multipleDeviceVideoBlockUserLogSchema);

multipleDeviceVideoBlockUserLogSchema.on('index', (error) => {
    console.error(error.message);
});

multipleDeviceVideoBlockUserLogSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = Model;
