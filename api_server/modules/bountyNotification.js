module.exports = class BountyNotification {
    static getStudentWithBountyId(database, params) {
        const sql = 'select student_id from bounty_post_detail where bounty_id = ?';
        return database.query(sql, [params.bounty_id]);
    }

    static getStudentWithAnswerId(database, params) {
        const sql = 'select student_id from bounty_answer_detail where answer_id = ?';
        return database.query(sql, [params.answer_id]);
    }
};
