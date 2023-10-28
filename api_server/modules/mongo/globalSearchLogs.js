const mongoose = require('mongoose');

const { Schema } = mongoose;
const GlobalSearchLogSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    student_class: { type: String, index: true, required: true },
    search_text: { type: String, default: null },
    search_id: { type: String, default: null },
    searched_item: { type: String, default: null },
    language: { type: String },
    eventType: { type: String, default: null },
    source: { type: String, default: null },
    size: { type: Number, default: 0 },
    is_clicked: { type: Boolean, default: false, index: true },
    data: { type: String, default: null },
    clicked_item: { type: String, default: null },
    clicked_item_type: { type: String, default: null },
    facet: { type: String, default: null },
    section: { type: String, default: null },
    clicked_position: { type: Number, default: 0 },
    clicked_item_id: { type: String, default: null },
    class_filter: { type: String, default: null },
    language_filter: { type: String, default: null },
    subject_filter: { type: String, default: null },
    chapter_filter: { type: String, default: null },
    book_name_filter: { type: String, default: null },
    author_filter: { type: String, default: null },
    publication_filter: { type: String, default: null },
    board_filter: { type: String, default: null },
    exam_filter: { type: String, default: null },
    teacher_filter: { type: String, default: null },
    sort_by: { type: String, default: null },
    version_code: { type: Number, default: 700 },
    variant_id: { type: Number, default: 0 },
    suggester_variant_id: { type: Number, default: 0 },
}, {
    timestamps: true,
});

const GlobalSearchModel = mongoose.model('GlobalSearchLog', GlobalSearchLogSchema);
GlobalSearchModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = GlobalSearchModel;
