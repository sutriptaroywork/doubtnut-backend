const mongoose = require('mongoose');

const { Schema } = mongoose;
const InappPopupSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    student_class: { type: String, index: true, required: true },
    inapp_popups_id: { type: Number, default: 0 },
    popup_type: { type: String, default: null },
    page: { type: String, default: null },
    nudge_id: { type: Number, default: 0 },
    session_id: { type: Number, default: null },
    action_type: { type: String, default: 'watched' },
    engagement_time: { type: Number, default: 0 },
    version_code: { type: Number, default: 1010 },
}, {
    timestamps: true,
});

const InappPopupLogs = mongoose.model('inappPopupLogs', InappPopupSchema);
InappPopupLogs.on('index', (error) => {
    console.log(error.message);
});

module.exports = InappPopupLogs;
