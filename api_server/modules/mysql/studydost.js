// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

module.exports = class StudyDostMysql {
    static isAlreadyRequested(database, studentId) {
        // request can not be created if student is in a group, either by accepting
        const sql = 'SELECT EXISTS(SELECT 1 FROM studydost_requests WHERE student_id = ? and status=1) as exist';
        return database.query(sql, [studentId]);
    }

    static createRequest(database, studentId) {
        const sql = 'INSERT INTO studydost_requests (student_id) VALUES (?)';
        return database.query(sql, [studentId]);
    }

    static getStudyDostRoomId(database, studentId) {
        // request can not be created if student is in a group, either by accepting
        const sql = 'SELECT room_id, student1, student2  FROM studydost WHERE status = 1 AND (student1 = ? or student2 = ?) LIMIT 1';
        return database.query(sql, [studentId, studentId]);
    }

    static getStudyDostName(database, studentId) {
        // request can not be created if student is in a group, either by accepting
        const sql = 'SELECT student_fname, student_lname FROM students WHERE student_id = ? LIMIT 1';
        return database.query(sql, [studentId]);
    }

    static isRoomBlocked(database, roomId) {
        // request can not be created if student is in a group, either by accepting
        const sql = 'SELECT EXISTS(SELECT 1 FROM studydost WHERE room_id = ? and status = 0) as exist';
        return database.query(sql, [roomId]);
    }

    static blockRoom(database, roomId) {
        const sql = 'UPDATE studydost set status = 0 WHERE room_id = ?';
        return database.query(sql, [roomId]);
    }

    static getFcmId(database, studentId) {
        const sql = 'SELECT gcm_reg_id FROM students WHERE student_id=?';
        return database.query(sql, [studentId]);
    }

    static allowRequest(database, studentIds) {
        const sql = 'UPDATE studydost_requests set status = 0 WHERE student_id in (?)';
        return database.query(sql, [studentIds]);
    }

    static getStudyDostStudents(database, roomId) {
        const sql = 'SELECT student1, student2 FROM studydost WHERE room_id = ?';
        return database.query(sql, [roomId]);
    }
};
