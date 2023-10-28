module.exports = class Olympiad {
    static getAssortmentIdsOfStudent(database, studentId) {
        const sql = 'SELECT assortment_id from student_package_subscription sps left join package p on sps.new_package_id = p.id WHERE student_id =? and assortment_id in (729011,729015,729020,729021,729022,729023,729033,729043,729058,729072,729082,729092,729101,729107)';
        // const sql = 'SELECT assortment_id from student_package_subscription sps left join package p on sps.new_package_id = p.id WHERE student_id = ? and sps.is_active > 0 and assortment_id in (87685)';
        return database.query(sql, [studentId]);
    }

    static getStudent(database, username) {
        const sql = 'select * from olympiad_registered_students where username = ?';
        return database.query(sql, [username]);
    }

    static registerOlympiad({
        database, name, email, mobile, studentClass, state, district, schoolName, username, studentId, registeredOnDoubtnut,
    }) {
        const sql = `INSERT INTO classzoo1.olympiad_registered_students (name,email,mobile,class,state,district,school_name,username,student_id,registered_on_doubtnut)
        VALUES (?,?,?,?,?,?,?,?,?,?)`;
        return database.query(sql, [name, email, mobile, studentClass, state, district, schoolName, username, studentId, registeredOnDoubtnut]);
    }

    static updateStudentOlympiadRegistration({
        database, name, email, mobile, studentClass, state, district, schoolName, username, studentId, registeredOnDoubtnut,
    }) {
        const sql = 'UPDATE olympiad_registered_students set name=?,email=?,mobile=?,class=?,state=?,district=?,school_name=?,username=?,student_id=?,registered_on_doubtnut=? where student_id = ?';
        return database.query(sql, [name, email, mobile, studentClass, state, district, schoolName, username, studentId, registeredOnDoubtnut, studentId]);
    }

    static getRegistrationData(database, studentId) {
        const sql = 'SELECT * from olympiad_registered_students where student_id = ?';
        return database.query(sql, [studentId]);
    }

    // V2

    static isStudentRegistered(database, mobile) {
        const sql = 'SELECT student_id from students where mobile = ?';
        return database.query(sql, [mobile]);
    }

    static addNewStudent(database, {
        studentFname, studentLname, schoolName, mobile, studentClass, username,
    }) {
        const sql = 'INSERT INTO students (student_fname, student_lname, school_name, mobile, student_class, student_username) VALUES (?, ?, ?, ?, ?, ?)';
        return database.query(sql, [studentFname, studentLname, schoolName, mobile, studentClass, username]);
    }

    static addHTRegisteredStudent(database, { user, studentId, isAlreadyRegistered }) {
        const sql = 'INSERT INTO ht_olympiad_students (username, name, email, mobile, class, state, district, school_name, student_id, is_registered_dn) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        return database.query(sql, [user.username, user.name, user.email, user.phone, parseInt(user.class.split(' ')[0]), user.state, user.district, user.school, studentId, isAlreadyRegistered]);
    }

    static getRegisteredStudentByUsername(database, username) {
        const sql = 'select * from ht_olympiad_students where username = ?';
        return database.query(sql, [username]);
    }

    static getRegisteredStudentByStudentId(database, studentId) {
        const sql = 'select * from ht_olympiad_students where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static updateOlympiadRegistration(database, { user, studentId, isAlreadyRegistered }) {
        const sql = 'UPDATE ht_olympiad_students set name=?, email=?, mobile=?, class=?, state=?, district=?, school_name=?, student_id=?, is_registered_dn=? where username = ?';
        return database.query(sql, [user.name, user.email, user.phone, user.class, user.state, user.district, user.school, studentId, isAlreadyRegistered, user.username]);
    }

    static getAssortmentIdsOfStudentByList(database, studentId, assortmentIds) {
        const sql = 'SELECT assortment_id from student_package_subscription sps left join package p on sps.new_package_id = p.id WHERE student_id =? and assortment_id in (?)';
        return database.query(sql, [studentId, assortmentIds]);
    }
};
