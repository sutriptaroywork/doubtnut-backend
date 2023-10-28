const mongoose = require('mongoose');

const TopicBoosterSchema = new mongoose.Schema({
    qid: { type: Number, required: true },
    subject: { type: String, required: true },
    qclass: { type: Number, required: true },
    stuclass: { type: Number, required: true },
    chapter: { type: String, required: true },
}, {
    timestamps: true,
});

const TopicBoosterModel = mongoose.model('topic_booster_logs', TopicBoosterSchema);

module.exports = TopicBoosterModel;
