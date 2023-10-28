module.exports = class StudentPersonalisation {
    static getStudentSubjectPrefrence(client, student_id) {
        return client.hgetAsync('dn-student-personalisation', student_id);
    }

    static setStudentSubjectPrefrence(client, student_id, pref_obj) {
        return client.hsetAsync('dn-student-personalisation', student_id, JSON.stringify(pref_obj));
    }

    static deleteSubjectPrefrence(client, student_id) {
        return client.hdel('dn-student-personalisation', student_id);
    }
};
