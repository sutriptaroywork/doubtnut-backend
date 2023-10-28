const knex = require('knex')({ client: 'mysql' });
const tables = require('./mysql/tables');

module.exports = class StudentCourseMapping {
    static checkForStudentPersonalisationOptin(database, student_id) {
        // const sql = `select * from student_course_mapping where student_id =${student_id}`;
        const sql = knex(tables.scm)
            .select('id', 'student_id', 'title', 'ccm_id')
            .where('student_id', student_id)
            .toQuery();
        return database.query(sql);
    }

    static async checkForActiveStudentPersonalisationOptin(database, student_id) {
        const sql = 'select * from ((select * from student_course_mapping  where student_id =?) as a inner join (select * from class_course_mapping where personalisation_active = 1) as b on a.ccm_id = b.id)';
        return database.query(sql, [student_id]);
    }


    static async getCcmIdWithCourseFromStudentId(database, student_id) {
        // 35ms
        const sql = 'SELECT scm.ccm_id, ccm.category, ccm.class, ccm.course, ccm.parent_ccm_id, ccm.stream_name, scm.type FROM student_course_mapping scm left join class_course_mapping ccm on ccm.id = scm.ccm_id WHERE scm.student_id = ? order by scm.created_at desc';
        return database.query(sql, [student_id]);
    }

    static getStudentSelectedCourse(student_id, database) {
        const sql = 'select ccm.id, ccm.category, ccm.course, ccm.parent_ccm_id, ccm.stream_name, scm.type from student_course_mapping scm join class_course_mapping ccm on ccm.id = scm.ccm_id where scm.student_id = ? and ccm.category in ("exam","board")';
        return database.query(sql, [student_id]);
    }

    static async checkForActiveWidgetSubjectPersonalistion(database, student_id) {
        const sql = 'select * from ((select * from student_course_mapping  where student_id =?) as a inner join (select * from class_course_mapping where sub_personalisation_active = 1 ) as b on a.ccm_id = b.id)';
        return database.query(sql, [student_id]);
    }

    static async getCcmIdsActiveForSubjectPersonalisation(database, student_id) {
        const sql = 'select b.ccm_id from ((select * from student_course_mapping  where student_id =?) as a inner join (select id as ccm_id from class_course_mapping where sub_personalisation_active = 1 ) as b on a.ccm_id = b.ccm_id)';
        return database.query(sql, [student_id]);
    }

    static displayCheckForWidget(database, student_id, widget_type) {
        const sql = 'select * from(select * from student_course_mapping where student_id =?) as a inner join(select * from class_course_mapping where category =?) as b on a.ccm_id = b.id';
        return database.query(sql, [student_id, widget_type]);
    }

    static insertOptionSelectedForActionWidgets(database, insert_obj) {
        // const sql = 'insert into student_course_mapping ?';
        const sql = knex(tables.scm)
            .insert(insert_obj)
            .toQuery();
        return database.query(sql, insert_obj);
    }

    static removeDataFromStudentCourseMappingForWidget(database, student_id, widget_name) {
        const sql = 'delete from student_course_mapping where id in (select a.id from(SELECT * FROM student_course_mapping where student_id = ?) as a inner join(select * from class_course_mapping where category = ?) as b on a.ccm_id = b.id)';
        return database.query(sql, [student_id, widget_name]);
    }

    static removeDataFromStudentCourseMappingForWidget2(database, ids) {
        const sql = `delete from student_course_mapping where id in (${ids})`;
        // const ids_array = ids.split(',');
        // const sql = knex(tables.scm)
        //     .del()
        //     .whereIn('id', ids_array)
        //     .toQuery();
        return database.query(sql, [ids]);
    }

    static selectDataFromStudentCourseMappingForWidget(database, student_id, widget_name) {
        let sql = 'select GROUP_CONCAT(a.id) as list from(SELECT * FROM student_course_mapping where student_id = ?) as a inner join(select * from class_course_mapping where category = ?) as b on a.ccm_id = b.id';
        if (widget_name === 'stream') {
            sql = 'select GROUP_CONCAT(a.id) as list from(SELECT * FROM student_course_mapping where student_id = ? AND type = ?) as a inner join(select * from class_course_mapping where category = ?) as b on a.ccm_id = b.id';
            return database.query(sql, [student_id, widget_name, 'board']);
        }
        return database.query(sql, [student_id, widget_name]);
    }

    static selectStudentCourseMappingData(database, student_id, widget_name) {
        const sql = 'select GROUP_CONCAT(a.id) as list from(SELECT * FROM student_course_mapping where student_id = ? AND type = ?) as a inner join(select * from class_course_mapping where category = ?) as b on a.ccm_id = b.id';
        if (widget_name === 'board') {
            return database.query(sql, [student_id, 'stream', widget_name]);
        }
        return database.query(sql, [student_id, widget_name, widget_name]);
    }

    static insertWidgetSelectionForStudent(database, insert_obj) {
        const sql = 'insert into student_course_mapping  SET  ?';
        return database.query(sql, [insert_obj]);
    }

    static deleteWidgetSelectionForStudent(database, id) {
        const sql = 'DELETE FROM student_course_mapping WHERE id = ?';
        return database.query(sql, [id]);
    }

    static deleteAllFromStudentCourseMapping(database, student_id) {
        const sql = 'delete from student_course_mapping where student_id =?';
        return database.query(sql, [student_id]);
    }

    static getLatestWatchedVideo(database, student_id) {
        const sql = 'select answer_id from video_view_stats where student_id =? and answer_video <> \'text\' AND view_from = \'SRP\' order by view_id desc limit 1';
        return database.query(sql, [student_id]);
    }

    static getSelectExamBoard(database, studentId) {
        const sql = 'select a.ccm_id,b.course,b.category from student_course_mapping a left join class_course_mapping as b on a.ccm_id=b.id where b.is_active=1 and a.student_id=?';
        return database.query(sql, [studentId]);
    }

    static getSelectExamBoardAll(database, studentId) {
        const sql = 'select a.id AS table_id, a.ccm_id, b.course, b.category, a.type from student_course_mapping a left join class_course_mapping as b on a.ccm_id = b.id where a.student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getCcmIdByCourse(database, sclass, courseName) {
        const sql = 'select id from class_course_mapping where class = ? AND course = ?';
        return database.query(sql, [sclass, courseName]);
    }

    static getStudentBoardExam(database, studentId, type) { // 0.0006 seconds
        const sql = 'SELECT c.*, cdom.hindi_name FROM (SELECT scm.student_id, ccm.id, ccm.class, ccm.course, ccm.category FROM student_course_mapping scm LEFT JOIN class_course_mapping ccm ON scm.ccm_id = ccm.id) c LEFT JOIN course_display_ordering_mapping cdom ON c.course = cdom.course_name WHERE c.student_id = ? AND c.category = ?';
        return database.query(sql, [studentId, type]);
    }

    static getStudentCourse(database, studentId) {
        const sql = "select b.course from ((select ccm_id from student_course_mapping where student_id=?) as a inner join (select id,course,category from class_course_mapping where category='board') as b on a.ccm_id=b.id)";
        return database.query(sql, [studentId]);
    }

    static removeDataByCcmId(database, ids, checkOnlyIn = false) {
        let sql = 'delete from student_course_mapping where ccm_id not in (?)';
        if (checkOnlyIn) {
            sql = 'delete from student_course_mapping where ccm_id in (?)';
        }
        return database.query(sql, [ids]);
    }
};
