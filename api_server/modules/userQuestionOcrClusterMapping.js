class UserQuestionOcrClusterMapping {
    static getActiveClusterTypes(database, locale) {
        const sql = 'select * from user_question_ocr_cluster_mapping where locale = ? and is_active = 1 order by priority asc';
        return database.query(sql, locale);
    }
}

module.exports = UserQuestionOcrClusterMapping;
