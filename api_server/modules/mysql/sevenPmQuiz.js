module.exports = class sevenPmQuiz {
    static claimRewards(database, studentId, mobile, amount, date, description, name, pincode, flatNumber, street, landmark) {
        const sql = 'INSERT INTO question_pucho_rewards(student_id,whatsapp_phone_number,contest_date, reward, description, name, pincode, flat_number, street, landmark) VALUES (?,?,?,?,?,?,?,?,?,?)';
        return database.query(sql, [studentId, mobile, date, amount, description, name, pincode, flatNumber, street, landmark]);
    }

    static getIfPreviouslyClaimed(database, studentId, date, description) {
        const sql = 'select * from question_pucho_rewards where student_id = ? and contest_date = ? and description = ?';
        return database.query(sql, [studentId, date, description]);
    }
};
