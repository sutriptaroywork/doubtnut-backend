module.exports = class Course {
    static getContestsList(database) {
        const sql = 'SELECT * FROM `contest_list`';
        return database.query(sql);
    }

    static getMaxQno(student_id, contest_id, database) {
        const sql = 'SELECT max(q_no) as max_q_no FROM `contest_results` where student_id = ? AND contest_id=?';
        // let sql = "SELECT q_no as max_q_no FROM `contest_results` where student_id = "+student_id+" AND contest_id="+contest_id+" ORDER BY q_no DESC LIMIT 1";
        return database.query(sql, [student_id, contest_id]);
    }

    static getQuestionList(contest_id, database) {
        const sql = 'SELECT * FROM `contest_questions` where contest_id=?';
        return database.query(sql, [contest_id]);
    }

    static insertQuestionAnswer(student_id, contest_id, q_no, ans_no, database) {
        const sql = 'INSERT INTO `contest_results` VALUES(NULL, ?, ?, ?, ?)';
        return database.query(sql, [student_id, contest_id, q_no, ans_no]);
    }

    static checkAnswerExistance(student_id, contest_id, q_no, database) {
        const sql = 'SELECT * FROM `contest_results` WHERE student_id= ? AND q_no= ? AND contest_id= ?';
        return database.query(sql, [student_id, q_no, contest_id]);
    }

    static getById(id, database) {
        const sql = 'SELECT q_no as max_q_no FROM `contest_results` where id = ?';
        return database.query(sql, [id]);
    }
};
