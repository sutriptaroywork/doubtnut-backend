function MatchedQuestionsArrayItem(id, subject, video_language, duplicate_tag, duration, resource_type, ocr_text, matched_queries) {
    if (!id) {
        return null;
    }
    this.item = {};
    this.item._id = id;
    this.item._source = {};
    if (subject) {
        this.item._source.subject = subject;
    }
    if (video_language) {
        this.item._source.video_language = video_language;
    }
    if (duplicate_tag) {
        this.item._source.duplicateTag = duplicate_tag;
    }
    if (duration) {
        this.item._source.duration = duration;
    }
    if (resource_type) {
        this.item.resource_type = resource_type;
    }
    if (ocr_text) {
        this.item._source.ocr_text = ocr_text;
    }
    if (matched_queries) {
        this.item._source.matchedQueries = matched_queries;
    }
    return this.item;
}

module.exports = MatchedQuestionsArrayItem;
