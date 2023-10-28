// let Utility = require('./utility');
module.exports = class UserAnswerFeedback {
    static getAnswerFeedBackByStudent(student_id, answer_id, database) {
        const sql = 'SELECT * from user_answer_feedback where answer_id = ? and student_id =? and is_active = 1';
        // console.log(sql)
        return database.query(sql, [answer_id, student_id]);
    }

    static getAnswerFeedBackByStudentNew(student_id, answer_id, answer_video, database) {
        const sql = 'SELECT * from user_answer_feedback where answer_id = ? and student_id =? and is_active = 1 and answer_video=?';
        // console.log(sql)
        return database.query(sql, [answer_id, student_id, answer_video]);
    }
};
