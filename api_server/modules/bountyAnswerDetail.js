module.exports = class BountyAnswerDetail {
    static getMySolutionsBountyList(database, student_id, limit, order, filters) {
        const sql = `Select bad.*, now() as curr_time, bpd.*  from bounty_answer_detail bad join bounty_post_detail bpd on bad.bounty_id = bpd.bounty_id where bad.student_id = ?  ${filters}  and bad.is_delete = 0  order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getMySolutionsBountyListNext(database, student_id, limit, lastId, order, filters) {
        const sql = `select bad.*, now() as curr_time, bpd.* from bounty_answer_detail bad join bounty_post_detail bpd on bad.bounty_id = bpd.bounty_id where bad.student_id = ? and answer_id < ? ${filters} and bad.is_delete = 0 order by ${order} limit ?`;
        return database.query(sql, [student_id, lastId, limit]);
    }

    static getAnswersBybountyId(database, bounty_id, limit) {
        // const sql = `select * from bounty_answer_detail where bounty_id = ${bounty_id} order by created_at desc limit ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        const sql = 'SELECT bad.*,  now() as curr_time, b.student_class, CONCAT( b.student_fname,\' \',b.student_lname ) as student_name, b.student_username, b.img_url from bounty_answer_detail as bad join students b on bad.student_id = b.student_id  where bad.bounty_id = ? and bad.is_delete = 0 order by bad.answer_id desc limit ?';
        // console.log(sql);
        return database.query(sql, [bounty_id, limit]);
    }

    static getAnswersBybountyIdNext(database, bounty_id, limit, lastId) {
        const sql = 'SELECT a.*, now() as curr_time, b.student_class, CONCAT( b.student_fname,\' \',b.student_lname ) as student_name, b.student_username , b.img_url from bounty_answer_detail as a join students b on a.student_id = b.student_id  where a.bounty_id = ? and a.is_delete = 0 and a.answer_id < ? order by a.answer_id desc limit ?';
        // console.log('sql', sql);
        return database.query(sql, [bounty_id, lastId, limit]);
    }

    static accpetVideoSolution(database, obj) {
        const sql = 'UPDATE bounty_answer_detail SET acceptance_flag = 1, bounty_earned = ?, accepted_at = now() where answer_id = ? and bounty_id = ?';
        return database.query(sql, [obj.bounty_earned, obj.answer_id, obj.bounty_id]);
    }

    static deleteAnswerPost(database, obj) {
        const sql = 'UPDATE bounty_answer_detail  SET ? where answer_id = ? and student_id = ?';
        return database.query(sql, [obj, obj.answer_id, obj.student_id]);
    }

    static getAnswerDeatilsByAnswerId(database, answer_id) {
        const sql = 'select a.bounty_id, a.student_id, b.question_id, a.created_at from bounty_answer_detail a join bounty_post_detail b on a.bounty_id = b.bounty_id  where a.answer_id = ?';
        return database.query(sql, [answer_id]);
    }

    static checkForDeleteQuestionPost(database, obj) {
        const sql = 'select answer_id from bounty_answer_detail where bounty_id = ? limit 1';
        return database.query(sql, [obj.bounty_id]);
    }

    static checkForDeleteAnswerPost(database, obj) {
        const sql = 'select acceptance_flag from bounty_answer_detail where answer_id = ?';
        return database.query(sql, [obj.answer_id]);
    }

    static validateAccepting(database, obj) {
        const sql = 'select count(answer_id) as total from bounty_answer_detail WHERE bounty_id = ? and acceptance_flag = 1';
        return database.query(sql, [obj.bounty_id]);
    }

    static getTotalAnswers(database, str) {
        const sql = `select count(answer_id) as answer_count, bounty_id from bounty_answer_detail where bounty_id in  ${str} and is_delete = 0  group by bounty_id`;
        // console.log('sql', sql);
        return database.query(sql);
    }

    static getStudentsByBountyId(database, bounty_id) {
        const sql = 'select distinct(student_id) from bounty_answer_detail where bounty_id = ?';
        return database.query(sql, [bounty_id]);
    }
};
