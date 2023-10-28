const Utility = require('./utility');

module.exports = class BountyPostDetail {
    static getBountyQuestions(database, student_class, limit, page) {
        const sql = `select * from bounty_post_detail where student_class = ? and is_answered = 0 order by created_at desc limit ?
            OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [student_class, limit]);
    }

    static getBountyQuestionsWithoutClass(database, limit, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username, c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd left join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad  on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id  where bpd.is_delete = 0 ${filters} and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [limit]);
    }

    static getBountyQuestionsWithoutClassNext(database, limit, lastId, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name,c.student_username , c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd left join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id where bpd.bounty_id < ? ${filters} and bpd.is_delete = 0  and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [lastId, limit]);
    }

    static getQuestionsWithNoSolutionNext(database, limit, lastId, order, filters) {
        const sql = `select bpd.*, 0 as answer_count,  concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd  join students c on bpd.student_id = c.student_id where bpd.bounty_id < ? ${filters} and bpd.is_delete = 0 and bpd.is_active = 1 and bpd.is_answered = 0 order by ${order} limit ?`;
        return database.query(sql, [lastId, limit]);
    }

    static getQuestionsWithNoSolution(database, limit, order, filters) {
        const sql = `select bpd.*, 0 as answer_count,  concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd  join students c on bpd.student_id = c.student_id where bpd.is_delete = 0 and bpd.is_active = 1 ${filters} and bpd.is_answered = 0 order by ${order} limit ?`;
        return database.query(sql, [limit]);
    }

    static getBountyQuestionsWithSolutions(database, limit, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd join bounty_answer_detail bad on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id where bpd.is_delete = 0 ${filters} and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [limit]);
    }

    static getBountyQuestionsWithSolutionsNext(database, limit, lastId, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username, c.img_url, 'question' as tag, 'all' as type, now() as curr_time from bounty_post_detail bpd join bounty_answer_detail bad on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id where bpd.bounty_id < ? ${filters} and bpd.is_delete = 0 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [lastId, limit]);
    }

    static getMyQuestion(database, student_id, limit, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_counts, 'question' as type,  now() as curr_time from bounty_post_detail bpd left join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad  on bpd.bounty_id = bad.bounty_id where bpd.student_id = ? ${filters} and bpd.is_delete = 0 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getMyQuestionNext(database, student_id, limit, lastId, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_counts, 'question' as type,  now() as curr_time from bounty_post_detail bpd left join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad  on bpd.bounty_id = bad.bounty_id where bpd.student_id = ? and bpd.bounty_id < ? ${filters} and bpd.is_delete = 0 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, lastId, limit]);
    }

    static getMyQuestionNextWithSolvedSolutionNext(database, student_id, limit, lastId, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_count, 'question' as type,  now() as curr_time from bounty_post_detail bpd join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad  on bpd.bounty_id = bad.bounty_id where bpd.student_id = ? and bpd.bounty_id < ? ${filters} and bpd.is_delete = 0 and bpd.is_answered = 1 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, lastId, limit]);
    }

    static getMyQuestionNextWithSolvedSolution(database, student_id, limit, order, filters) {
        const sql = `select bpd.*, count(bad.answer_id) as answer_count, 'question' as type,  now() as curr_time from bounty_post_detail bpd join (SELECT * from bounty_answer_detail where is_delete = 0 ) as bad  on bpd.bounty_id = bad.bounty_id where bpd.student_id = ? ${filters} and bpd.is_delete = 0 and bpd.is_answered = 1 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getMyQuestionNextWithNoSolutionNext(database, student_id, limit, lastId, order, filters) {
        const sql = `select bpd.*, 0 as answer_count, 'question' as type,  now() as curr_time from bounty_post_detail bpd  where bpd.student_id = ? and bpd.bounty_id < ? ${filters} and bpd.is_delete = 0 and bpd.is_answered = 0 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, lastId, limit]);
    }

    static getMyQuestionNextWithNoSolution(database, student_id, limit, order, filters) {
        const sql = `select bpd.*, 0 as answer_count, 'question' as type,  now() as curr_time from bounty_post_detail bpd  where bpd.student_id = ? ${filters} and bpd.is_delete = 0 and bpd.is_answered = 0 and bpd.is_active = 1 group by bpd.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getQuestionbyBountyId(database, bounty_id) {
        const sql = 'select * from bounty_post_detail where bounty_id = ?';
        return database.query(sql, [bounty_id]);
    }

    static getBountyQuestionDetailByQid(database, question_id) {
        const sql = 'select a.*, now() as curr_time from bounty_post_detail a where question_id = ? and a.is_active = 1 and a.is_delete = 0 order by a.bounty_id desc limit 1';
        return database.query(sql, [question_id]);
    }

    static updateSubject(database, obj) {
        const sql = 'UPDATE bounty_post_detail SET ? where question_id = ? and student_id = ? and is_delete = 0 and is_active = 1';
        return database.query(sql, [obj, obj.question_id, obj.student_id]);
    }

    static getExams(database) {
        const sql = 'select distinct(exam) from bounty_post_detail';
        return database.query(sql);
    }

    static getChapterFromBountyPost(database) {
        const sql = "SELECT question_subject, chapter from bounty_post_detail where chapter <> '' and question_subject <> '' and is_active = 1 group by 1,2";
        return database.query(sql);
    }

    static getBountyRaiser(database, obj) {
        const sql = 'select student_id  from bounty_post_detail where bounty_id = ?';
        return database.query(sql, [obj.bounty_id]);
    }

    static updateBountyPost(database, obj) {
        const sql = 'UPDATE bounty_post_detail SET ? where bounty_id = ?';
        return database.query(sql, [obj, obj.bounty_id]);
    }

    static reuploadOldBounty(database, obj) {
        const sql = 'UPDATE bounty_post_detail SET is_delete = ? where bounty_id = ?';
        return database.query(sql, [obj, obj.is_delete, obj.bounty_id]);
    }

    static checkingSelfAnswer(database, obj) {
        const sql = 'select student_id from bounty_post_detail where bounty_id = ?';
        return database.query(sql, [obj.bounty_id]);
    }

    static getBountyDetailsByBountyId(database, bounty_id) {
        const sql = 'select * from bounty_post_detail where bounty_id = ? and is_delete = 0 and is_active = 1';
        return database.query(sql, [bounty_id]);
    }

    static getBountyQuestionsByQidForReupload(database, question_id) {
        const sql = 'select * from bounty_post_detail where question_id = ?';
        return database.query(sql, [question_id]);
    }
};
