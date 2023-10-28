const Utility = require('../utility');

module.exports = class Doubtfeed {
    static async getTopicDetails(db, studentId, topic) {
        const sql = 'SELECT * FROM daily_doubt where sid = ? AND topic = ? AND date(date) = date(NOW())';
        return db.query(sql, [studentId, topic]);
    }

    static async updateQuestionId(db, topicId, questionIdList) {
        const sql = 'UPDATE daily_doubt SET qid_list = ? where id = ?';
        return db.query(sql, [questionIdList, topicId]);
    }

    static async setTopicDetails(db, obj) {
        const sql = 'INSERT daily_doubt SET ?';
        return db.query(sql, [obj]);
    }

    static getTopicByDate(db, studentId) {
        const sql = 'SELECT * FROM daily_doubt WHERE sid = ? AND date(date) = (SELECT date(date) FROM daily_doubt WHERE sid = ? ORDER BY date DESC LIMIT 1) ORDER BY id DESC';
        return db.query(sql, [studentId, studentId]);
    }

    static getTodaysTopics(db, studentId) {
        const sql = 'SELECT * FROM daily_doubt WHERE sid = ? AND date(date) = CURDATE()';
        return db.query(sql, [studentId]);
    }

    static getPreviousDaysTopics(db, studentId, size) {
        const sql = 'SELECT * FROM daily_doubt WHERE sid = ? AND date(date) != CURDATE() ORDER BY date DESC LIMIT ?';
        return db.query(sql, [studentId, size]);
    }

    static getBooksLibraryData(db, topicName) {
        const sql = 'SELECT * FROM new_library WHERE id IN (SELECT DISTINCT book_playlist_id FROM ncert_questions_details WHERE chapter_name = ?) AND is_active = 1 ORDER BY playlist_order';
        return db.query(sql, [topicName]);
    }

    static getTopicProgress(db, topicId) {
        const sql = 'SELECT type, is_viewed, topic_reference FROM daily_doubt_resources WHERE topic_reference = ?';
        return db.query(sql, [topicId]);
    }

    static getActiveTopicData(db, topicId) {
        const sql = 'SELECT id, type, data_list, is_viewed FROM daily_doubt_resources WHERE topic_reference = ?';
        return db.query(sql, [topicId]);
    }

    static getPreviousTopicByDate(db, studentId, topicName, currentDate) {
        const sql = 'SELECT id FROM daily_doubt WHERE sid = ? AND topic = ? AND date(date) != ? ORDER BY date DESC LIMIT 1';
        return db.query(sql, [studentId, topicName, currentDate]);
    }

    static getQuestionList(db, topicId) {
        const sql = 'SELECT type, data_list as resource_id from daily_doubt_resources WHERE topic_reference = ?';
        return db.query(sql, [topicId]);
    }

    static setDoubtFeedResourceData(db, obj) {
        const sql = 'INSERT into daily_doubt_resources set ?';
        return db.query(sql, [obj]);
    }

    static getPdfData(db, topicName, classVal) {
        const sql = 'SELECT id, subject, class, chapter, pdf_url FROM chapter_pdf_details WHERE is_pdf_ready = 1 AND chapter = ? AND class = ? ORDER BY id DESC';
        return db.query(sql, [topicName, classVal]);
    }

    static getPdfById(db, idList) {
        const sql = `SELECT id, subject, class, chapter, pdf_url FROM chapter_pdf_details WHERE id IN (${idList})`;
        return db.query(sql);
    }

    static getFormulaSheets(db, topicName, classVal) {
        const sql = 'SELECT id, level1, level2, location, img_url FROM pdf_download WHERE package = \'FORMULA SHEET\' AND status = 1 AND level2 = ? AND class = ?';
        return db.query(sql, [topicName, classVal]);
    }

    static getFormulaById(db, idList) {
        const sql = `SELECT id, level1, level2, location, img_url FROM pdf_download WHERE id IN (${idList})`;
        return db.query(sql);
    }

    static getTopicQuestions(db, topicName, classVal) {
        const sql = `SELECT c.*, q.ocr_text FROM (SELECT hqm.question_id, hqm.widget_name, hqm.class, hqm.subject,
                    hqm.chapter, ts.opt_1, ts.opt_2, ts.opt_3, ts.opt_4, ts.answer, ts.solutions
                    FROM homepage_questions_master hqm LEFT JOIN text_solutions ts ON hqm.question_id = ts.question_id
                    WHERE hqm.chapter = ? AND hqm.class = ? AND hqm.is_active = 1 AND ts.solutions <> ''
                    AND ts.opt_1 <> '' AND ts.opt_2 <> '' AND ts.opt_3 <> '' AND ts.opt_4 <> '' AND ts.answer <> '') c
                    LEFT JOIN questions q ON c.question_id = q.question_id`;
        return db.query(sql, [topicName, classVal]);
    }

    static getTopicQuestionsById(db, topicName, referenceList) {
        const sql = `SELECT c.*, q.ocr_text FROM (SELECT hqm.question_id, hqm.widget_name, hqm.class, hqm.subject,
                    hqm.chapter, ts.opt_1, ts.opt_2, ts.opt_3, ts.opt_4, ts.answer, ts.solutions
                    FROM homepage_questions_master hqm LEFT JOIN text_solutions ts ON hqm.question_id = ts.question_id
                    WHERE hqm.question_id IN (${referenceList})) c LEFT JOIN questions q ON c.question_id = q.question_id`;
        return db.query(sql, [topicName]);
    }

    static getTopicVideo(database, topicName) {
        const sql = 'SELECT q.*, a.duration FROM questions q LEFT JOIN answers a ON q.question_id = a.question_id WHERE q.chapter = ? AND q.student_id < 100 AND a.duration IS NOT NULL AND a.duration <> \'\' AND a.duration <> \'NULL\' LIMIT 10';
        return database.query(sql, [topicName]);
    }

    static getSimilarQuestionsByIds(database, idList) {
        const sql = `SELECT MAX(answer_id) AS answer_id, q.*, a.duration FROM questions q LEFT JOIN answers a ON q.question_id = a.question_id WHERE q.question_id IN (${idList}) GROUP BY a.question_id`;
        return database.query(sql);
    }

    static getDoubtFeedInfo(db, studentId) {
        const sql = 'SELECT * FROM daily_doubt where sid = ?';
        return db.query(sql, [studentId]);
    }

    static getTopicBoosterGameId(db, resourceId) {
        const sql = 'SELECT * from daily_doubt_resources WHERE id = ? AND type = \'TOPIC_MCQ\'';
        return db.query(sql, resourceId);
    }

    static getTaskById(db, rowId) {
        const sql = 'SELECT * FROM daily_doubt_resources where id = ?';
        return db.query(sql, [rowId]);
    }

    static getTodaysLatestDoubt(db, studentId) {
        const { todayStartDateTime, todayEndDateTime } = Utility.todayEndAndStarting();
        const sql = `SELECT id, topic FROM daily_doubt where sid = ? AND date > '${todayStartDateTime}' AND date < '${todayEndDateTime}' ORDER BY id DESC LIMIT 1`;
        return db.query(sql, [studentId]);
    }

    static getLatestTopicTasks(db, id) {
        const sql = 'SELECT id, is_viewed FROM daily_doubt_resources where topic_reference = ?';
        return db.query(sql, [id]);
    }

    static getStudentDataList(studentIds, database) {
        const sql = `SELECT student_id, CONCAT(student_fname, ' ', student_lname) AS name, img_url as image
                     FROM students WHERE student_id IN (?)`;
        return database.query(sql, [studentIds]);
    }
};
