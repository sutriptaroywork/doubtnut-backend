module.exports = class StudentsDeviceData {
    static insertStudentDeviceData(database, student_id, contact, udid) {
        const data_obj = {
            student_id,
            mobile: contact,
            udid,
        };
        const sql = 'insert into students_device_mapping SET ?';
        return database.query(sql, [data_obj]);
    }
};
