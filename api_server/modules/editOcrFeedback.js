module.exports = class EditOcrFeedback {
    static insertEditOcrLogs(database, obj) {
        const sql = 'insert into edit_ocr_feedback SET ?';
        return database.query(sql, obj);
    }
};
