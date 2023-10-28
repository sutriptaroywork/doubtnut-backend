module.exports = class BountyAnswerQualityCheck {
    static checkIfVoted(database, obj) {
        const sql = 'select vote from bounty_answer_quality_check where answer_id = ? and student_id = ?';
        return database.query(sql, [obj.answer_id, obj.student_id]);
    }

    static updateVote(database, obj) {
        const sql = 'Update bounty_answer_quality_check set vote = ? where student_id = ? and answer_id = ?';
        console.log(sql);
        return database.query(sql, [obj.vote, obj.student_id, obj.answer_id]);
    }

    static upsertVote(database, obj) {
        const sql = 'INSERT INTO bounty_answer_quality_check ( answer_id, bounty_id, vote, student_id ) VALUES ( ?, ?, ?, ?) on duplicate KEY UPDATE vote = ?';
        // console.log('sqllllllllll', sql);
        return database.query(sql, [obj.answer_id, obj.bounty_id, obj.vote, obj.student_id, obj.vote]);
    }

    static checkVoteStatus(database, student_id, answer_ids) {
        const sql = 'select vote, answer_id from bounty_answer_quality_check where student_id = ? and answer_id in (?)';
        // console.log(sql);
        return database.query(sql, [student_id, answer_ids]);
    }
};
