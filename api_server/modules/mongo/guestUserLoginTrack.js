const mongoose = require('mongoose');
const moment = require('moment');
const guestLoginData = require('../../data/data.guestLogin');

const guestUserLoginTrackSchema = new mongoose.Schema({
    student_id: { type: Number, index: true, required: true },
    guest_login_timestamp: { type: Date, index: true },
    login_completion_timestamp: { type: Date, index: true },
}, {
    timestamps: true,
});

const Model = mongoose.model(guestLoginData.guest_login_timestamp_tracking_collection, guestUserLoginTrackSchema);

guestUserLoginTrackSchema.on('index', (error) => {
    console.error(error.message);
});

guestUserLoginTrackSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = Model;
