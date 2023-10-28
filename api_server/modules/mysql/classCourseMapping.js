const _ = require('lodash');

module.exports = class ClassCourseMapping {
    static getHomePageWidgetContentByType(database, widget_type, student_class, other) {
        const sql = 'select   a.id,category as name,b.img_url , a.course as display, b.ui_type as type from ((SELECT * from class_course_mapping where category =? and class= ? and other =? and is_active=1) as a inner join (select * from course_repo) as b on a.course =b.name) order by a.priority';
        return database.query(sql, [widget_type, student_class, other]);
    }

    static getActiveExams(database, student_class) {
        const sql = 'SELECT * FROM `class_course_mapping` WHERE `class` = ? AND `category` = "exam" AND `is_active` = 1';
        return database.query(sql, student_class);
    }

    static getByCourseName(database, courseName, studentClass) {
        const sql = 'SELECT * FROM `class_course_mapping` WHERE `course` = ? AND class = ?';
        return database.query(sql, [courseName, studentClass]);
    }

    static getHindiCourseName(database, courseName, studentClass) {
        const sql = 'SELECT ccm.id, ccm.class, cdom.hindi_name AS course, ccm.course AS english_title, ccm.category FROM `class_course_mapping` ccm LEFT JOIN course_display_ordering_mapping cdom ON ccm.course = cdom.course_name WHERE ccm.class = ? AND cdom.hindi_name = ?';
        return database.query(sql, [studentClass, courseName]);
    }
    // let sql =
    //   "SELECT a.class,b.class_display FROM ( SELECT DISTINCT class FROM mc_course_mapping where active_status in (1,2)) as a left join (SELECT class," +
    //   language +
    //   " as class_display FROM `class_display_mapping`)as b on a.class=b.class";
    // let sql = "SELECT a.class,b.class_display FROM ( SELECT DISTINCT class FROM mc_course_mapping ) as a left join (SELECT class,"+language+" as class_display FROM `class_display_mapping`)as b on a.class=b.class";
    // console.log(sql);
    // return database.query(sql);

    static getStreamDetails(database, parentId, locale) {
        // let sql = 'SELECT ccm.id, ccm.course AS title, ccm.category AS type, ccm.id AS code, ccm.is_active FROM `class_course_mapping` ccm LEFT JOIN `ccm_stream_mapping` csm ON ccm.id = csm.child_ccm_id WHERE csm.parent_ccm_id = ? AND csm.is_active = 1 ORDER BY csm.order_id';
        let sql = 'SELECT id, course AS title, category AS type, id AS code, parent_ccm_id, is_active, priority AS order_id, stream_name FROM class_course_mapping WHERE parent_ccm_id = ? AND is_active = 1 ORDER BY priority';
        if (locale === 'hindi') {
            sql = 'SELECT ccm.id, cdom.hindi_name AS title, ccm.category AS type, ccm.id AS code, ccm.parent_ccm_id, ccm.is_active, ccm.priority AS order_id, ccm.stream_name FROM class_course_mapping ccm LEFT JOIN course_display_ordering_mapping cdom ON ccm.course = cdom.course_name WHERE ccm.parent_ccm_id = ? AND ccm.is_active = 1';
        }
        return database.query(sql, [parentId]);
    }

    static getCourseDetailsByParentCcmStream(database, parentId, stream) {
        const sql = 'SELECT * FROM class_course_mapping WHERE parent_ccm_id = ? AND stream_name = ?';
        return database.query(sql, [parentId, stream]);
    }

    static getCCMDetails(database, ccmId) {
        const sql = 'SELECT * FROM `class_course_mapping` WHERE id = ?';
        return database.query(sql, [ccmId]);
    }

    static getAllStreamsByIds(database, ids) {
        const sql = 'SELECT * FROM class_course_mapping WHERE parent_ccm_id IN (?) AND is_active = 1';
        return database.query(sql, [ids]);
    }

    static getCcmIdFromCourseClass(database, studentClass, course) {
        const sql = 'SELECT id, course from class_course_mapping where class = ? and course = ?';
        return database.query(sql, [studentClass, course]);
    }
};
