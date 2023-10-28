module.exports = class UserProperties {
    static getByStudentID(database, studentID) {
        const sql = 'select properties from student_properties where student_id=? limit 1';
        return database.query(sql, [studentID]);
    }
};
