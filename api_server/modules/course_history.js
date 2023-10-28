// const request = require("request")
module.exports = class History {
    static getStudentDetailsBySid(student_id, database) {
        const sql = 'select * from course_browse_history where student_id = ? ORDER BY id DESC LIMIT 1 ';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static updateCourseById(id, course, database) {
        const sql = 'update course_browse_history set course = ? where id = ?';
        // console.log(sql);
        return database.query(sql, [course, id]);
    }

    static updateCourseByIdNew(id, course, sclass, database) {
        const sql = 'update course_browse_history set course = ?,class=? where id = ?';
        // console.log(sql);
        return database.query(sql, [course, sclass, id]);
    }
};
