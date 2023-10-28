module.exports = class Bounty {
    static insertBounty(database, obj) {
        const sql = 'INSERT INTO bounty_post_detail (student_id, bounty_ques_img, question_id, student_class, is_answered, is_active, expired_at) VALUES (?,?,?,?,?,?, NOW() + INTERVAL 1 DAY) ';
        return database.query(sql, [obj.student_id, obj.bounty_ques_img, obj.question_id, obj.student_class, obj.is_answered, obj.is_active]);
    }

    static insertAnswerDetail(database, obj) {
        // insert answers
        const sql = 'INSERT INTO bounty_answer_detail SET ?';
        return database.query(sql, obj);
    }

    static RemoveBookMarking(database, obj) {
        // remove the bookmarked question
        const sql = 'Update bounty_book_marking SET ?';
        return database.query(sql, obj);
    }

    static addVote(database, obj) {
        const sql = 'INSERT INTO bounty_answer_quality_check SET ?';
        return database.query(sql, obj);
    }
};
