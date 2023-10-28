const _ = require('lodash');

module.exports = class KheloJeetoMysql {
    static getStudentData(studentId, database) {
        const sql = 'SELECT student_id, student_fname as name, gcm_reg_id, img_url as image FROM students WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getQuestionsByChapter(database, topic) {
        const sql = `SELECT DISTINCT (b.question_id),opt_1,opt_2,opt_3,opt_4,answer,subject,chapter,ocr_text as question_text
                    FROM (SELECT question_id, opt_1, opt_2, opt_3, opt_4, answer
                          FROM text_solutions WHERE opt_1 != '' AND opt_2 != '' AND opt_3 != '' AND opt_4 != ''
                            AND answer IN ('a', 'b', 'c', 'd')) AS a JOIN
                         (SELECT question_id, subject, chapter, ocr_text FROM questions WHERE student_id < 102 AND ocr_text != '') AS b
                         ON a.question_id = b.question_id WHERE b.chapter = ? LIMIT 500`;
        return database.query(sql, [topic]);
    }

    static getStudentDataList(studentIds, database) {
        const sql = `SELECT student_id, CONCAT(student_fname, ' ', student_lname) AS name, img_url as image
                     FROM students WHERE student_id IN (?)`;
        return database.query(sql, [studentIds]);
    }

    static getFollowersList(studentId, database) {
        const sql = `SELECT s.student_id, CONCAT(s.student_fname, ' ', s.student_lname) AS name, s.student_class, s.img_url as image
                     FROM user_connections uc INNER JOIN students s ON s.student_id = uc.user_id
                     WHERE uc.connection_id = ? and uc.is_deleted = 0`;
        return database.query(sql, [studentId]);
    }

    static getFollowingList(studentId, database) {
        const sql = `SELECT s.student_id, CONCAT(s.student_fname, ' ', s.student_lname) AS name, s.student_class, s.img_url as image
                     FROM user_connections uc INNER JOIN students s ON s.student_id = uc.connection_id
                     WHERE uc.user_id = ? and uc.is_deleted = 0`;
        return database.query(sql, [studentId]);
    }

    static getStudentIdByMobile(mobile, database) {
        const sql = "SELECT student_id FROM students WHERE mobile = '?'";
        return database.query(sql, [mobile]);
    }
};
