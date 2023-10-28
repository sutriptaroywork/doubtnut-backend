const mongoose = require('mongoose');

const kafkaBkpMsgSchema = new mongoose.Schema({
    topic: { type: String, required: true },
    msg: { type: Object, required: true },
}, {
    timestamps: false,
});

const KafkaBkpMsgModel = mongoose.model('kafka_bkp_msg', kafkaBkpMsgSchema);

module.exports = KafkaBkpMsgModel;
