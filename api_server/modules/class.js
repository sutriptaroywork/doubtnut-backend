const Course_History = require('./course_history');
const Student = require('./student');

module.exports = class Class {
    static getList(database) {
        const sql = 'SELECT DISTINCT class FROM mc_course_mapping where active_status=1';
        return database.query(sql);
    }

    static async getStudentClass(student_id, database) {
        try {
            const student = await Course_History.getStudentDetailsBySid(student_id, database);
            if (student.length < 1) {
                return [];
            }
            return student;
        } catch (e) {
            return [];
        }
    }
};
