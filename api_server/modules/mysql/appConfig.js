// eslint-disable-next-line no-unused-vars
const _ = require('lodash');
// let Utility = require('./utility');
module.exports = class AppConfig {
    static getLanguages(database) {
        const sql = 'SELECT * FROM languages WHERE is_active = 1';
        return database.query(sql);
    }

    static isStringDiffActive(student_class, database) {
        const sql = 'SELECT key_value FROM app_configuration WHERE key_name = \'apply_string_diff\' and class in (?,\'all\') and is_active = 1';
        console.log(sql);
        return database.query(sql, [student_class]);
    }

    static getConfig(database) {
        const sql = "SELECT * FROM app_configuration where class = 'all' and is_active = 1";
        return database.query(sql);
    }

    static getWhatsappData(database, student_class) {
        const sql = "select * from app_configuration where class in ('all',?) and is_active=1 and key_name='whatsapp_ask'";
        return database.query(sql, [student_class]);
    }

    static getVideoViewCheck(database) {
        const sql = "select * from app_configuration where is_active=1 and key_name='video_view_stats'";
        return database.query(sql);
    }


    static checkStudentIITRollNo(studentId, database) {
        const sql = 'select * from students_iit where student_id=?';
        return database.query(sql, [studentId]);
    }

    static updateStudentDob(studentId, dob, database) {
        const params = { dob };
        const sql = 'UPDATE students SET ?  where student_id = ?';
        return database.query(sql, [params, studentId]);
    }

    static insertRollNo(studentId, rollNo, dob, database) {
        const obj = {};
        obj.student_id = studentId;
        obj.iit_roll_no = rollNo;
        obj.dob = dob;
        const sql = 'INSERT INTO `students_iit` set ?';
        return database.query(sql, obj);
    }


    static getAppConfigByKey(database, key) {
        const sql = 'select * from app_configuration where key_name=? and is_active=1';
        return database.query(sql, [key]);
    }

    static getAppConfigByKeyAndClass(database, key, className) {
        const sql = 'select * from app_configuration where key_name=? and class in (?,\'all\') and is_active=1';
        return database.query(sql, [key, className]);
    }
};
