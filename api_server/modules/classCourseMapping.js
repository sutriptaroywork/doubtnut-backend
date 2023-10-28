module.exports = class ClassCourseMapping {
    static getActionWidgetsByCategory(database, category) {
        const sql = 'select distinct course from class_course_mapping where category =?';
        return database.query(sql, [category]);
    }

    static classCourse(student_class, database) {
        const sql = 'select ccm.id,ccm.category,ccm.course, cr.img_url from class_course_mapping ccm join course_repo cr on cr.name = ccm.course where ccm.category in ("board","exam") and ccm.is_active = 1 and ccm.class = ? order by ccm.priority';
        return database.query(sql, [student_class]);
    }

    static allClassCourse(student_class, database) {
        const sql = 'select ccm.id,ccm.category,ccm.course, cr.img_url, ccm.class from class_course_mapping ccm join course_repo cr on cr.name = ccm.course where ccm.category in ("board","exam") and ccm.is_active = 1 group by ccm.class, ccm.course order by ccm.priority';
        return database.query(sql);
    }

    static getStudentsExamsBoardsData(database, sId, type = 'none') {
        if (type === 'board' || type === 'exam') {
            const sql = 'SELECT b.*, a.id as table_id FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id = b.id where a.student_id = ? and b.category = ? AND a.type = ?';
            return database.query(sql, [sId, type, type]);
        }
        if (type === 'stream') {
            const sql = 'SELECT b.*, a.id as table_id FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id = b.id where a.student_id = ? and b.category = ? AND a.type = ?';
            return database.query(sql, [sId, 'board', type]);
        }
        const sql = 'SELECT b.*, a.id as table_id FROM student_course_mapping as a left join class_course_mapping as b on a.ccm_id=b.id where a.student_id = ? ORDER BY a.id DESC';
        return database.query(sql, [sId]);
    }

    static getExams(database) {
        const sql = 'select distinct(course) from class_course_mapping order by course asc';
        return database.query(sql);
    }

    static getFilteredCcmIdsByClass(database, arr, filter, st_class) {
        const ids = arr.join();
        const sql = `select * from class_course_mapping where id in (${ids}) and class = ${st_class} and category='${filter}'`;
        return database.query(sql, [ids, st_class, filter]);
    }

    static getBoardFromCcmId(database, ccmId) {
        const sql = 'select course, category, parent_ccm_id from class_course_mapping where id = ?';
        return database.query(sql, [ccmId]);
    }

    static allClassCourseByRegion(database, region) {
        const sql = 'select ccm.id, ccm.category, ccm.course, cr.img_url, ccm.class from class_course_mapping ccm join course_repo cr on cr.name = ccm.course where ccm.category in ("board","exam") and ccm.stream_name = "Science" and ccm.region = ? and ccm.is_active = 1 group by ccm.class, ccm.course order by ccm.priority';
        return database.query(sql, [region]);
    }

    static getBoardExamByClass(database, courseClass) {
        const sql = `select ccm.id, ccm.category, ccm.course, cr.img_url, ccm.class from class_course_mapping ccm join course_repo cr on cr.name = ccm.course where ccm.category in ('board','exam') and ccm.region = 'IN' and ccm.is_active = 1 and class in (${courseClass}) group by ccm.class, ccm.course order by ccm.class, ccm.priority`;
        console.log(sql);
        return database.query(sql, [courseClass]);
    }

    static getIdByCategoryClassCourse(database, category, studentClass, course) {
        // 7 ms
        const sql = 'SELECT id from class_course_mapping WHERE category = ? AND class = ? AND course = ?';
        return database.query(sql, [category, studentClass, course]);
    }

    static getCourseById(database, id) {
        const sql = 'SELECT ccm.id,ccm.category, ccm.course, ccm.parent_ccm_id, ccm.stream_name, cdom.hindi_name FROM class_course_mapping ccm LEFT JOIN course_display_ordering_mapping cdom ON ccm.course = cdom.course_name WHERE ccm.id = ?';
        return database.query(sql, [id]);
    }
};
