const mongoose = require('mongoose');
const moment = require('moment');

const { Schema } = mongoose;

const ProfanityBankSchema = new Schema({
    word: { type: String, index: true },
    languae: { type: String, index: true },
    parent: { type: String, index: true },
    is_active: { type: Boolean, index: true },
}, {
    timestamps: true,
});

ProfanityBankSchema.pre('save', (next) => {
    this.createdAt = moment(this.createdAt).toISOString();
    this.updatedAt = moment(this.updatedAt).toISOString();
    next();
});
const ProfanityBankModel = mongoose.model('ProfanityBank', ProfanityBankSchema);
ProfanityBankModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = ProfanityBankModel;
