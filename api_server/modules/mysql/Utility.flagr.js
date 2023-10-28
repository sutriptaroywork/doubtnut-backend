module.exports = class Flagr {
    static getFlagrConfig(database, studentID, flagID) {
        const sql = 'select * from flagr_student_info where student_id=? and flag_id=?';
        // console.log(sql);
        return database.query(sql, [studentID, flagID]);
    }

    static setFlagrConfig(database, data) {
        const sql = 'INSERT ignore into flagr_student_info set ?';
        // console.log(sql);
        return database.query(sql, [data]);
    }

    static getFlagrConfigUsingFlagKey(database, studentID, flagKey) {
        const sql = 'select * from flagr_student_info_with_flag_key where student_id=? and flag_key=?';
        // console.log(sql);
        return database.query(sql, [studentID, flagKey]);
    }

    static setFlagrConfigUsingFlagKey(database, data) {
        const sql = 'INSERT ignore into flagr_student_info_with_flag_key set ?';
        // console.log(sql);
        return database.query(sql, [data]);
    }
    
};
