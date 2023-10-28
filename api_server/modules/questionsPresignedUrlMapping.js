module.exports = class QuestionsPreSignedUrlMapping {
    static insertPresignedUrl(database, obj) {
        const sql = 'INSERT INTO questions_pre_signed_url_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static updateImageUploadedStatus(database, question_id, is_uploaded_flag) {
        const sql = 'UPDATE questions_pre_signed_url_mapping SET is_uploaded =? where question_id = ?';
        return database.query(sql, [is_uploaded_flag, question_id]);
    }
};
