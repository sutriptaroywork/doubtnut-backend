module.exports = class StudentsUpload {
    static insertIntostudentUpload(database, obj) {
        const sql = 'INSERT IGNORE INTO students_upload_marksheet SET ?';
        return database.query(sql, obj);
    }

    static UpdateStudetMarkesheetUpload(database, obj) {
        const params = [];
        params.push(obj);
        params.push(obj.student_id);
        const sql = 'UPDATE students_upload_marksheet SET ? WHERE student_id = ?';
        return database.query(sql, params);
    }

    static getStudentIdByHash(database, hash) {
        const sql = 'SELECT * FROM students_upload_marksheet WHERE hash = ?';
        return database.query(sql, [hash]);
    }
};
