module.exports = class Bounty {
    static getStudentWhoAnswered(db, bounty_id){
        const sql = 'select student_id from Bounty_Post_Detail where bounty_id = ' +bounty_id;
        return db.query(sql);
    }
    static getAcceptedAnswerStudent(db, answer_id){
        const sql = 'select student_id from Bounty_Answer_Detail where answer_id = ' +answer_id;
        return db.query(sql);
    }
}