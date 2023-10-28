module.exports = class Brainly {
    static getQuestionData(qid, database) {
        const sql = 'SELECT * FROM questions_web_external WHERE id = ?';
        return database.query(sql, [qid]);
    }

    static getQuestionDataWithUrl(url, database) {
        const sql = 'SELECT max(id) AS id FROM questions_web_external WHERE url LIKE ? ORDER BY id DESC';
        return database.query(sql, [`${url}%`]);
    }

    static getSolData(qid, database) {
        const sql = 'SELECT * FROM web_external_text_answers WHERE question_id = ?';
        return database.query(sql, [qid]);
    }
};
