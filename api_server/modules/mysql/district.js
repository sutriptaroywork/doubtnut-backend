module.exports = class District {
    static createFormEntry(database, mobile, name, district, state, student_id, friends_count) {
        const sql = 'INSERT INTO district_admin_form (mobile, name, district, state, student_id, friends_count) VALUES (?, ?, ?, ?, ?, ?);';
        database.query(sql, [mobile, name, district, state, student_id, friends_count]);
    }

    static checkForStudent(database, student_id) {
        const check_sql = 'SELECT id from district_admin_form where student_id = ? and is_active = 1';
        const check = database.query(check_sql, [student_id]);
        return check;
    }
};
