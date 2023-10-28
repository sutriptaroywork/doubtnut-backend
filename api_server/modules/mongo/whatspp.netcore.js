const mongoose = require('mongoose');
const moment = require('moment');

const WhatsAppSchema = new mongoose.Schema({
    phone: { type: String, index: true, required: true },
    studentId: { type: mongoose.Schema.Types.Number, index: true },
    event: { type: mongoose.Schema.Types.Mixed },
    reply: { type: mongoose.Schema.Types.Mixed },
    context: { type: mongoose.Schema.Types.Mixed },
    prevContext: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date },
    updatedAt: { type: Date },
}, {
    timestamps: true,
});

const WhatsAppModel = mongoose.model('whatsapp_netcore', WhatsAppSchema);

WhatsAppSchema.on('index', (error) => {
    console.error(error.message);
});

WhatsAppSchema.pre('save', (next) => {
    this._id = new mongoose.ObjectId();
    this.studentId = parseInt(this.studentId);
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString();
    this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30, 'm').toISOString();
    next();
});

module.exports = WhatsAppModel;
