module.exports = class questionPuchoContest {
    static insertIntoQuestionPuchoContestRewards(database, studentId, mobile, amount, date) {
        const sql = 'INSERT INTO question_pucho_rewards(student_id,whatsapp_phone_number,contest_date, reward, description) VALUES (?,?,?,?,\'question_pucho_contest_v2\')';
        return database.query(sql, [studentId, mobile, date, amount]);
    }

    static getIfPreviouslyClaimed(database, studentId, date) {
        const sql = 'select * from question_pucho_rewards where student_id = ? and contest_date = ?';
        return database.query(sql, [studentId, date]);
    }

    static getBucketValue(database, bucket, name) {
        const sql = 'select value from dn_property where bucket = ? and name = ? and is_active = 1';
        return database.query(sql, [bucket, name]);
    }
};
