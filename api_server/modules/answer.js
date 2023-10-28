// eslint-disable-next-line no-unused-vars
const Utility = require('./utility');

module.exports = class Answer {
    static getAnswerByQuestionId(qid, database) {
        const sql = 'select * from answers where question_id = ? order by answer_id desc limit 1';
        return database.query(sql, [qid]);
    }

    static viewAnswerByQid(qid, database) {
    // TODO : add left join here
    // let sql = 'SELECT questions.*, answers.* FROM questions, answers WHERE questions.question_id = answers.question_id AND questions.question_id = ' + qid + ' order by answers.answer_id desc limit 1'
        const sql = 'SELECT a.*, answers.* FROM (Select * from questions where question_id=?) as a inner join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        return database.query(sql, [qid]);
    }

    static viewAnswerByMCid(mc_id, database) {
    // let sql = "SELECT questions.*, answers.* FROM questions, answers WHERE questions.question_id = answers.question_id AND questions.doubt = '" + mc_id +"' order by answers.answer_id desc limit 1"
        const sql = 'SELECT a.*, answers.* FROM (Select * from questions where doubt=?) as a inner join answers on a.question_id = answers.question_id order by answers.answer_id desc limit 1';
        return database.query(sql, [mc_id]);
    }

    static getDuration(qid, answer_id, database) {
        const sql = 'SELECT duration FROM  answers WHERE question_id =? AND answer_id = ?';
        return database.query(sql, [qid, answer_id]);
    }

    static getJeeAdvanceSimilarVideos(doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 8 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getJeeMainsSimilarVideos(doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 3 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getXSimilarVideos(doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 9 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getXIISimilarVideos(doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 2 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getNcertSimilarVideos(doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 1 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getNcertSimilarVideosUpdated(question_id, doubt, limit, database) {
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = 1 and doubt <> ? and doubt > ? and is_answered = 1 order by doubt ASC limit ?';
        console.log(sql);
        return database.query(sql, [doubt, doubt, limit]);
    }

    static getBooksSimilarVideos(student_id, question_id, doubt, limit, database) { // 0.2 sec
        // const sql = 'SELECT question_id,ocr_text,question,matched_question FROM `questions`where student_id = ? and doubt <> ? and doubt > ? and is_answered=1 order by doubt ASC limit ?';
        const sql = 'SELECT question_id,ocr_text,question,matched_question FROM questions where student_id = ? and doubt > ? and (is_answered=1 or is_text_answered = 1) order by doubt ASC limit ?';
        // console.log(sql);
        return database.query(sql, [student_id, doubt, limit]);
    }

    static async addSearchedAnswer(obj, database) {
        const sql = 'INSERT INTO answers SET ?';
        return database.query(sql, obj);
    }

    // Function to get a row from answers table
    static getByAnswerId(question_id, database) {
        const sql = 'select * from answers where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static async addSearchedAnswerNew(obj, database) {
        const sql = 'INSERT INTO answers SET ?';
        return database.query(sql, obj);
    }

    static async getChapterDataByQid(database, qId) {
        const sql = 'SELECT c.*,d.master_chapter_aliases from (select a.question_id,a.class,a.subject,case when b.chapter is null then a.chapter else b.chapter end as chapter from questions as a left join questions_meta as b on a.question_id=b.question_id where a.question_id=? and (a.is_answered=1 or a.is_text_answered=1) and a.class <> \'14\') as c left join chapter_aliases_new as d on c.class=d.class and c.subject=d.subject and c.chapter=d.chapter group by d.master_chapter_aliases';
        return database.query(sql, [qId]);
    }

    static async updateViewId(vId, video_time, engage_time, database) {
        const sql = 'update video_view_stats set video_time= ?, engage_time=? where view_id=?';
        return database.query(sql, [video_time, engage_time, vId]);
    }

    static async addDownloadVideo(database, obj) {
        const sql = 'INSERT IGNORE INTO video_download SET ?';
        return database.query(sql, obj);
    }
};
