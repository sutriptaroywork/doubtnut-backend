module.exports = class Course {
    static getList(database, student_class) {
        let params = [];
        let sql = '';
        if (student_class == '13') {
            sql = 'SELECT DISTINCT course FROM mc_course_mapping WHERE class=\'12\' AND active_status=1 AND course <> \'NCERT\'';
        } else if (student_class == '14') {
            sql = 'SELECT DISTINCT course FROM mc_course_mapping WHERE class=\'14\' AND active_status=2 ';
        } else {
            sql = 'SELECT DISTINCT course FROM mc_course_mapping WHERE class=? AND active_status=1';
            params = [student_class];
        }
        return database.query(sql, params);
    }

    static getNcertClass(database) {
        const sql = 'SELECT distinct class FROM `mc_course_mapping` where course =\'NCERT\' ORDER BY class DESC ';
        return database.query(sql);
    }

    static getNcertClassChapters(clazz, database) {
        const sql = 'SELECT distinct chapter FROM `mc_course_mapping` where course = \'NCERT\' and class= ?';
        return database.query(sql, [clazz]);
    }

    static getNcertDetails(database) {
        const sql = "SELECT   distinct class,chapter from mc_course_mapping where course = 'NCERT' ";
        return database.query(sql);
    }
};
