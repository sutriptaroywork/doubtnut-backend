module.exports = class QuestionsAskRetryLogging {
    static insertRetryData(database, obj) {
        const sql = 'INSERT INTO question_ask_retry_logging SET ?';
        return database.query(sql, obj);
    }
};
