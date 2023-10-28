module.exports = class AnswerFeedback {
    static getAnswerFeedBackByStudent(sid, answer_video, database) {
        const sql = 'SELECT * from user_answer_feedback where answer_video = ? and student_id =? and is_active = 1';
        return database.query(sql, [answer_video, sid]);
    }
};
