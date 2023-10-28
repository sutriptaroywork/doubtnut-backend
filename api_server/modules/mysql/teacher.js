module.exports = class Teacher {
    static create(database, obj) {
        const sql = 'INSERT IGNORE INTO teachers SET ?';
        return database.query(sql, [obj]);
    }

    static getById(database, teacherId) {
        const sql = 'select * from teachers where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static getByMobile(database, mobile) {
        const sql = 'select * from teachers where mobile=?';
        return database.query(sql, [mobile]);
    }

    static update(database, teacherId, params) {
        const sql = 'UPDATE teachers SET ? where teacher_id = ?';
        return database.query(sql, [params, teacherId]);
    }

    static getSubjectByClass(database, classMeta) {
        const sql = `select distinct subject from vod_class_subject_course_mapping where subject <> 'TRAINING' and subject <> 'ANNOUNCEMENT' and class in (${classMeta})`;
        return database.query(sql, [classMeta]);
    }

    static getActiveLocale(database, teacherId) {
        const sql = 'select locale from teachers_locale_mapping where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getActiveClass(database, teacherId) {
        const sql = 'select class from teachers_class_mapping where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getActiveBoard(database, teacherId) {
        const sql = 'select board from teachers_board_mapping where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getActiveExam(database, teacherId) {
        const sql = 'select exam from teachers_exam_mapping where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getActiveSubject(database, teacherId) {
        const sql = 'select subject from teachers_subject_mapping where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static deactiveLocale(database, teacherId) {
        const sql = 'update teachers_locale_mapping set is_active=0 where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static upsertLocale(database, data) {
        const sql = 'INSERT into teachers_locale_mapping (teacher_id,locale, is_active) VALUES ? ON DUPLICATE KEY UPDATE is_active = 1';
        return database.query(sql, [data]);
    }

    static deactiveClass(database, teacherId) {
        const sql = 'update teachers_class_mapping set is_active=0 where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static upsertClass(database, data) {
        const sql = 'INSERT into teachers_class_mapping (teacher_id,class, is_active) VALUES ? ON DUPLICATE KEY UPDATE is_active = 1';
        return database.query(sql, [data]);
    }

    static deactiveBoard(database, teacherId) {
        const sql = 'update teachers_board_mapping set is_active=0 where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static upsertBoard(database, data) {
        const sql = 'INSERT into teachers_board_mapping (teacher_id, board, is_active) VALUES ? ON DUPLICATE KEY UPDATE is_active = 1';
        return database.query(sql, [data]);
    }

    static deactiveExam(database, teacherId) {
        const sql = 'update teachers_exam_mapping set is_active=0 where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static upsertExam(database, data) {
        const sql = 'INSERT into teachers_exam_mapping (teacher_id, exam, is_active) VALUES ? ON DUPLICATE KEY UPDATE is_active = 1';
        return database.query(sql, [data]);
    }

    static deactiveSubject(database, teacherId) {
        const sql = 'update teachers_subject_mapping set is_active=0 where teacher_id=?';
        return database.query(sql, [teacherId]);
    }

    static upsertSubject(database, data) {
        const sql = 'INSERT into teachers_subject_mapping (teacher_id, subject, is_active) VALUES ? ON DUPLICATE KEY UPDATE is_active = 1';
        return database.query(sql, [data]);
    }

    static addPayment(database, data) {
        const sql = 'INSERT ignore into teachers_payment_mapping set ?';
        return database.query(sql, [data]);
    }

    static getPaymentDetails(database, teacherId) {
        const sql = "select *, 'test.png' as image_url from teachers_payment_mapping where teacher_id=? and is_active=1";
        return database.query(sql, [teacherId]);
    }

    static setDefaultPayment(database, teacherId, bankCode) {
        const sql = 'update teachers_payment_mapping set is_default=1 where teacher_id = ? and bank_code = ?';
        return database.query(sql, [teacherId, bankCode]);
    }

    static removePreviousDefault(database, teacherId) {
        const sql = 'update teachers_payment_mapping set is_default=0 where teacher_id = ?';
        return database.query(sql, [teacherId]);
    }

    static getMeta(database, teacherId) {
        const sql = 'select fname, lname, gender, email, img_url, college, degree, mobile, country_code, pincode, location, about_me, year_of_experience, username, dob, is_verified from teachers where teacher_id = ?';
        return database.query(sql, [teacherId]);
    }

    static getChapters(database, language, classMeta, subject) {
        const sql = 'select distinct chapter from class_syllabus_mapping where meta_info= ? and class= ? and subject= ? order by chapter_order asc';
        return database.query(sql, [language, classMeta, subject]);
    }

    static getCategory(database, classMeta, language) {
        const sql = 'select distinct category from class_syllabus_mapping where class= ? and meta_info= ?';
        return database.query(sql, [classMeta, language]);
    }

    static getSubjects(database, classMeta, language, category) {
        const sql = 'select distinct subject from class_syllabus_mapping where class= ? and meta_info= ? and category = ?';
        return database.query(sql, [classMeta, language, category]);
    }

    static addTeacherResourceUpload(database, params) {
        const sql = 'INSERT INTO teachers_resource_upload SET ?';
        return database.query(sql, [params]);
    }

    static markTeacherResourceUpload(database, teacherId, courseResourceId, isUpload) {
        const sql = 'update teachers_resource_upload SET is_uploaded = ? where teacher_id = ? and course_resource_id = ?';
        return database.query(sql, [isUpload, teacherId, courseResourceId]);
    }

    static getCourseNameByCCmId(database, ccmId) {
        const sql = 'select course from class_course_mapping where id=?';
        return database.query(sql, [ccmId]);
    }

    static getPdfResouceByCategory(database, teacherId, studentClass, categoryType, limit) { // 40 ms
        const sql = 'select cr.* from course_resources cr left join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.meta_info = ? and cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.resource_type=2 and tru.is_uploaded = 1 limit ? ';
        return database.query(sql, [categoryType, teacherId, studentClass, limit]);
    }

    static getDinstinctSubject(database, teacherId, studentClass) { // 30 - 40 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct subject from course_resources where faculty_id = ? and class = ? and vendor_id = 3';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct subject from course_resources where faculty_id = ? and vendor_id = 3';
        return database.query(sql, [teacherId]);
    }

    static getDinstinctSubjectApp(database, teacherId, studentClass) { // 30 - 40 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct cr.subject from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and tru.is_uploaded = 1';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct cr.subject from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and tru.is_uploaded = 1';
        return database.query(sql, [teacherId]);
    }

    static getDinstinctCategories(database, teacherId, studentClass) { // 30 - 40 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct board from course_resources where faculty_id = ? and class = ? and vendor_id = 3';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct board from course_resources where faculty_id = ? and vendor_id = 3';
        return database.query(sql, [teacherId]);
    }

    static getDinstinctCategoriesApp(database, teacherId, studentClass) { // 30 - 40 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct cr.board from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and tru.is_uploaded = 1';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct cr.board from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and tru.is_uploaded = 1';
        return database.query(sql, [teacherId]);
    }

    static getFilteredResources(database, teacherId, classMeta, tabFilter, subFilter) { // 40 ms
        let sql = '';
        if (tabFilter === 'subject') {
            sql = 'select cr.*, ts.views, ts.updated_at as view_date from course_resources cr left join teachers_stats ts on ts.course_resource_id = cr.id inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and tru.is_uploaded = 1 order by cr.id desc limit 20';
        }
        if (tabFilter === 'category') {
            sql = 'select cr.*, ts.views, ts.updated_at as view_date from course_resources cr left join teachers_stats ts on ts.course_resource_id = cr.id inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and tru.is_uploaded = 1 order by cr.id desc limit 20';
        }
        return database.query(sql, [teacherId, classMeta, subFilter]);
    }

    static subscribe(database, params) {
        const sql = 'INSERT ignore into teachers_student_subscription set ?';
        return database.query(sql, [params]);
    }

    static checkSubscription(database, studentId, teacherId) {
        const sql = 'select * from teachers_student_subscription where student_id=? and teacher_id=? and is_active=1';
        return database.query(sql, [studentId, teacherId]);
    }

    static getSubscribedTeachersData(database, studentId) { // 20 ms
        const sql = 'select tss.teacher_id from teachers_student_subscription tss inner join teachers t on t.teacher_id = tss.teacher_id where tss.is_active = 1 and tss.student_id = ? and t.is_verified = 1 and t.is_active = 1';
        return database.query(sql, [studentId]);
    }

    static getTeacherByCCMExam(database, ccmIds, studentClass) { // 50 ms
        const sql = 'select t.teacher_id, t.img_url, t.fname, t.lname, t.year_of_experience, GROUP_CONCAT(distinct(tem.exam)) as exam, GROUP_CONCAT(distinct(tsm.subject)) as subjects from teachers_exam_mapping tem inner join teachers t on t.teacher_id = tem.teacher_id left join teachers_resource_upload tru on tru.teacher_id = t.teacher_id left join teachers_subject_mapping tsm on tsm.teacher_id = t.teacher_id inner join course_resources cr on cr.id = tru.course_resource_id where tem.is_active = 1 and t.is_verified = 1 and t.is_active = 1 and tem.exam = ? and tru.is_uploaded = 1 and cr.class = ? and tsm.is_active = 1 and tem.is_active = 1 and tsm.is_active =1 group by t.teacher_id';
        return database.query(sql, [ccmIds, studentClass]);
    }

    static getTeacherByCCMBoard(database, ccmIds, studentClass) { // 50 ms
        const sql = 'select t.teacher_id, t.img_url, t.fname, t.lname, t.year_of_experience, GROUP_CONCAT(distinct(tbm.board)) as board, GROUP_CONCAT(distinct(tsm.subject)) as subjects from teachers_board_mapping tbm inner join teachers t on t.teacher_id = tbm.teacher_id left join teachers_resource_upload tru on tru.teacher_id = t.teacher_id left join teachers_subject_mapping tsm on tsm.teacher_id = t.teacher_id inner join course_resources cr on cr.id = tru.course_resource_id where tbm.is_active = 1 and t.is_verified = 1 and t.is_active = 1 and tbm.board = ? and tru.is_uploaded = 1 and cr.class = ? and tsm.is_active = 1 and tbm.is_active = 1 and tsm.is_active = 1 group by t.teacher_id';
        return database.query(sql, [ccmIds, studentClass]);
    }

    static getResourceCount(database, teacherId) {
        const sql = 'select count(*) as resource_count, class from course_resources where faculty_id=? and vendor_id = 3 group by class order by resource_count desc';
        return database.query(sql, [teacherId]);
    }

    static getDistinctFilters(database, teacherId, classMeta, tabFilter, subFilter) { // 20 - 30 ms
        let sql = '';
        if (tabFilter === 'subject') {
            sql = 'select distinct cr.resource_type, cr.meta_info from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and tru.is_uploaded = 1 order by cr.id desc';
        }
        if (tabFilter === 'category') {
            sql = 'select distinct cr.resource_type, cr.meta_info from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and tru.is_uploaded = 1 order by cr.id desc';
        }
        return database.query(sql, [teacherId, classMeta, subFilter]);
    }

    static getFilteredResourcesChannel(database, teacherId, classMeta, tabFilter, subFilter, contentfilter, resourceType, limit, offset, versionCode) { // 30 - 40 ms
        let sql = '';
        if (tabFilter === 'subject') {
            if (resourceType === 1) {
                if (parseInt(versionCode) < 9800) {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, ts.updated_at as view_date from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                } else {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, ts.updated_at as view_date from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                }
            } else {
                sql = 'select cr.*, tru.is_uploaded from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and cr.meta_info = ? order by cr.id desc limit ? offset ?';
                return database.query(sql, [teacherId, classMeta, subFilter, resourceType, contentfilter, limit, offset]);
            }
        }
        if (tabFilter === 'category') {
            if (resourceType === 1) {
                if (parseInt(versionCode) < 9800) {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, ts.updated_at as view_date from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                } else {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, ts.updated_at as view_date from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                }
            } else {
                sql = 'select cr.*, tru.is_uploaded from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and cr.meta_info = ? order by cr.id desc limit ? offset ?';
                return database.query(sql, [teacherId, classMeta, subFilter, resourceType, contentfilter, limit, offset]);
            }
        }
        return database.query(sql, [teacherId, classMeta, subFilter, resourceType, limit, offset]);
    }

    static getTeacherVideos(database, teacherId, versionCode, limit) { // 40 ms
        let sql = '';
        if (parseInt(versionCode) < 9800) {
            sql = 'select cr.*, t.lname, t.fname, t.img_url, tru.is_uploaded, ts.views from course_resources cr left join teachers t on t.teacher_id = cr.faculty_id inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.resource_type = 1 and t.is_verified = 1 and t.is_active = 1 and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 group by cr.resource_reference order by cr.created_at desc limit ?';
        } else {
            sql = 'select cr.*, t.lname, t.fname, t.img_url, tru.is_uploaded, ts.views from course_resources cr left join teachers t on t.teacher_id = cr.faculty_id inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference inner join answer_video_resources avr on avr.answer_id = a.answer_id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.resource_type = 1 and t.is_verified = 1 and t.is_active = 1 and tru.is_uploaded = 1 and group by cr.resource_reference order by cr.created_at desc limit ?';
        }
        return database.query(sql, [teacherId, limit]);
    }

    static updateSubscription(database, params) {
        const sql = 'UPDATE teachers_student_subscription set is_active = ? where teacher_id = ? and student_id = ?';
        return database.query(sql, [params.is_active, params.teacher_id, params.student_id]);
    }

    static checkOldSubscription(database, studentId, teacherId) {
        const sql = 'select * from teachers_student_subscription where student_id=? and teacher_id=?';
        return database.query(sql, [studentId, teacherId]);
    }

    static getTeacherByClassLocale(database, classMeta, locale) { // 40 ms
        const sql = 'select distinct t.teacher_id, t.img_url, t.fname, t.lname, t.year_of_experience, GROUP_CONCAT(distinct(tsm.subject)) as subjects from teachers_class_mapping tcm inner join teachers_locale_mapping tlm on tlm.teacher_id = tcm.teacher_id left join teachers_subject_mapping tsm on tsm.teacher_id = tcm.teacher_id inner join teachers t on t.teacher_id = tlm.teacher_id left join teachers_resource_upload tru on tru.teacher_id = t.teacher_id inner join course_resources cr on cr.id = tru.course_resource_id where tcm.class = ? and tlm.locale = ? and tlm.is_active = 1 and tcm.is_active = 1 and t.is_verified = 1 and t.is_active = 1 and tru.is_uploaded = 1 and cr.class = ? and tsm.is_active =1 group by t.teacher_id';
        return database.query(sql, [classMeta, locale, classMeta]);
    }

    static getSubscribedStudentsList(database, teacherId) {
        const sql = 'select s.student_id, s.gcm_reg_id, s.is_online, s.locale from teachers_student_subscription tss left join students s on tss.student_id = s.student_id where tss.teacher_id = ? and tss.is_active = 1 and s.is_online > 950';
        return database.query(sql, [teacherId]);
    }

    static getTeacherIdByQuestionId(database, questionID) { // 20 ms
        const sql = 'select faculty_id from course_resources where resource_reference = ? and vendor_id = 3';
        return database.query(sql, [questionID]);
    }

    static getSubsTotal(database, teacherId) {
        // TODO :- add vendoe check
        const sql = 'select count(*) as total from teachers_student_subscription where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getTeacherVideoLikeStats(database, questionId) {
        const sql = 'select count(*) as total from user_answer_feedback where question_id = ? and rating = 5';
        return database.query(sql, [questionId]);
    }

    static getTeacherVideoDislikeStats(database, questionId) {
        const sql = 'select count(*) as total from user_answer_feedback where question_id = ? and rating = 0';
        return database.query(sql, [questionId]);
    }

    static getTeacherVideoShareStats(database, questionId) {
        const sql = 'select count(*) as total from whatsapp_share_stats where entity_id = ? and entity_type = "video"';
        return database.query(sql, [questionId]);
    }

    static checkRecourceIsTeacherVideo(database, questionId) { // 20 ms
        const sql = 'select t.teacher_id from course_resources cr left join teachers t on t.teacher_id = cr.faculty_id where cr.resource_reference = ? and cr.resource_type = 1 and t.is_active =1 and t.is_verified = 1 and cr.vendor_id = 3';
        return database.query(sql, [questionId]);
    }

    static getSubscriberData(database, teacherId) {
        const sql = 'select count(*) as subscribers from teachers_student_subscription tss left join teachers t on t.teacher_id = tss.teacher_id where tss.teacher_id = ? and tss.is_active = 1 and t.is_active = 1 and t.is_verified = 1';
        return database.query(sql, [teacherId]);
    }

    static getBoardName(database, cmmList, category) { // 20 ms
        const sql = 'select id, course from class_course_mapping where id in (?) and category in (?)';
        return database.query(sql, [cmmList, category]);
    }

    static getImage(database) {
        const sql = 'select key_value from app_configuration where key_name = "teacher_login_image"';
        return database.query(sql, [this.teacherId]);
    }

    static getTeacherProfileLeaderBoardDetails(database, teacherId) { // 30 - 40ms
        const sql = 'select teacher_id, img_url, fname, lname from teachers where teacher_id in (?)';
        return database.query(sql, [teacherId]);
    }

    static getResourceDetails(database, teacherId, resourceId, resourceType) { // 30-40 ms
        let sql = '';
        if (resourceType === 'video') {
            sql = 'select cr.*, avr.resource_type as type from course_resources cr left join answers a on cr.resource_reference = a.question_id left join answer_video_resources avr on avr.answer_id = a.answer_id where cr.id=? and cr.faculty_id = ? and cr.vendor_id = 3';
        } else if (resourceType === 'pdf') {
            sql = 'select * from course_resources where id=? and cr.faculty_id = ? and cr.vendor_id = 3';
        }
        return database.query(sql, [resourceId, teacherId]);
    }

    static deleteResourceCourseResources(database, teacherId, resourceId) {
        const sql = 'update course_resources set is_active = 0 where id=? and faculty_id = ? and vendor_id = 3';
        return database.query(sql, [resourceId, teacherId]);
    }

    static deleteResourceTeacherUpload(database, teacherId, resourceId) {
        const sql = 'update teachers_resource_upload set is_uploaded = 0 where teacher_id=? and course_resource_id=?';
        return database.query(sql, [teacherId, resourceId]);
    }

    static getAllMonthsFilters(database, teacherId, type) { // 40 ms
        let sql;
        if (type === 1) {
            sql = 'select distinct(DATE_FORMAT(tru.updated_at,"%Y-%m")) as filters FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type = 1 order by tru.updated_at desc';
        } else {
            sql = 'select distinct(DATE_FORMAT(tru.updated_at,"%Y-%m")) as filters FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type <> 1 order by tru.updated_at desc';
        }
        return database.query(sql, [teacherId]);
    }

    static getResourceCountViewAll(database, teacherId, type, year, month) { // 30 ms
        let sql = '';
        if (type === 1) {
            if (year !== null && month !== null) {
                sql = 'select count(distinct(tru.course_resource_id)) as total FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type = 1 and MONTH(tru.updated_at) = ? and YEAR(tru.updated_at) = ?';
                return database.query(sql, [teacherId, month, year]);
            }
            sql = 'select count(distinct(tru.course_resource_id)) as total FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type = 1';
        } else {
            if (year !== null && month !== null) {
                sql = 'select count(distinct(tru.course_resource_id)) as total FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type <> 1 and MONTH(tru.updated_at) = ? and YEAR(tru.updated_at) = ?';
                return database.query(sql, [teacherId, month, year]);
            }
            sql = 'select count(distinct(tru.course_resource_id)) as total FROM teachers_resource_upload tru inner join course_resources cr on cr.id = tru.course_resource_id inner join answers a on a.question_id = cr.resource_reference where tru.teacher_id = ? and tru.is_uploaded = 1 and cr.resource_type <> 1';
        }
        return database.query(sql, [teacherId]);
    }

    static getFilteredResourcesMonthly(database, teacherId, contentfilter, type, limit, offset, versionCode, year, month) { // 80 ms
        let sql = '';
        if (type === 1) {
            if (parseInt(versionCode) < 9800) {
                sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.resource_type = ? and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 and MONTH(tru.updated_at) = ? and YEAR(tru.updated_at) = ? group by cr.resource_reference order by cr.id desc limit ? offset ?';
            } else {
                sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.resource_type = ? and tru.is_uploaded = 1 and MONTH(tru.updated_at) = ? and YEAR(tru.updated_at) = ? group by cr.resource_reference order by cr.id desc limit ? offset ?';
            }
        } else {
            sql = 'select cr.*, tru.is_uploaded from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.resource_type = ? and cr.meta_info = ? order by cr.id desc limit ? offset ?';
            return database.query(sql, [teacherId, type, contentfilter, month, year, limit, offset]);
        }
        return database.query(sql, [teacherId, type, month, year, limit, offset]);
    }

    static getFilteredResourcesViewAll(database, teacherId, classMeta, tabFilter, subFilter, contentfilter, resourceType, limit, offset, versionCode) { // 80 ms
        let sql = '';
        if (tabFilter === 'subject') {
            if (resourceType === 1) {
                if (parseInt(versionCode) < 9800) {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                } else {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                }
            } else {
                sql = 'select cr.*, tru.is_uploaded from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.subject in (?) and cr.resource_type = ? and cr.meta_info = ? order by cr.id desc limit ? offset ?';
                return database.query(sql, [teacherId, classMeta, subFilter, resourceType, contentfilter, limit, offset]);
            }
        }
        if (tabFilter === 'category') {
            if (resourceType === 1) {
                if (parseInt(versionCode) < 9800) {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and (cr.meta_info <> "gdrive" or cr.meta_info is null) and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                } else {
                    sql = 'select cr.*, tru.is_uploaded, ts.views, tru.created_at as date_farm from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id left join teachers_stats ts on ts.course_resource_id = cr.id left join answers a on a.question_id = cr.resource_reference where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and tru.is_uploaded = 1 group by cr.resource_reference order by cr.id desc limit ? offset ?';
                }
            } else {
                sql = 'select cr.*, tru.is_uploaded from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and cr.board in (?) and cr.resource_type = ? and cr.meta_info = ? order by cr.id desc limit ? offset ?';
                return database.query(sql, [teacherId, classMeta, subFilter, resourceType, contentfilter, limit, offset]);
            }
        }
        return database.query(sql, [teacherId, classMeta, subFilter, resourceType, limit, offset]);
    }

    static getvideoFarmStateByName(database, farmFilename) { // 60 ms
        const sql = 'select * from video_farm where input_path in (?)';
        return database.query(sql, [farmFilename]);
    }

    static getViewsByQuestionId(database, resourceId) { // 40 ms
        const sql = 'select views from teachers_stats where question_id = ?';
        return database.query(sql, [resourceId]);
    }

    static getDinstinctSubjectViewAll(database, teacherId, studentClass) { // 30 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct cr.subject from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and tru.is_uploaded = 1 and cr.resource_type = 1';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct cr.subject from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and tru.is_uploaded = 1 and cr.resource_type = 1';
        return database.query(sql, [teacherId]);
    }

    static getDinstinctCategoriesViewAll(database, teacherId, studentClass) { // 30 ms
        let sql = '';
        if (studentClass) {
            sql = 'select distinct cr.board from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and tru.is_uploaded = 1 and cr.resource_type = 1';
            return database.query(sql, [teacherId, studentClass]);
        }
        sql = 'select distinct cr.board from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and tru.is_uploaded = 1 and cr.resource_type = 1';
        return database.query(sql, [teacherId]);
    }

    static getDistinctClassViewAll(database, teacherId) { // 30 ms
        const sql = 'select distinct cr.class from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and tru.is_uploaded = 1 and cr.resource_type = 1';
        return database.query(sql, [teacherId]);
    }

    static getDistinctSubjectsByTeacherAndClass(database, teacherId, studentClass) { // 30 ms
        const sql = 'select distinct cr.subject from course_resources cr inner join teachers_resource_upload tru on tru.course_resource_id = cr.id where cr.faculty_id = ? and cr.vendor_id = 3 and cr.class = ? and tru.is_uploaded = 1 and cr.resource_type = 1 and cr.is_active = 1';
        return database.query(sql, [teacherId, studentClass]);
    }

    static getFreeCourseAndFacultyByClass(database, classMeta) { // 60 - 70 ms
        const sql = 'select ctm.faculty_id, GROUP_CONCAT(distinct(ctm.assortment_id)) as assortment_ids, GROUP_CONCAT(distinct(ctm.subject)) as subjects, du.name, du.experience, du.degree, du.college, du.image_url, du.gender from course_teacher_mapping ctm inner join course_details cd on cd.assortment_id = ctm.assortment_id left join dashboard_users du on du.id = ctm.faculty_id where cd.assortment_type = "course" and cd.is_free = 1 and cd.class = ? and cd.is_active = 1 group by ctm.faculty_id order by cd.start_date desc';
        return database.query(sql, [classMeta]);
    }

    static getAssortmentDetails(database, assortmentId) { // 60 ms
        const sql = 'select * from course_details where assortment_id = ? and assortment_type = "course" and is_active = 1';
        return database.query(sql, [assortmentId]);
    }

    static getSubsTotalInternal(database, teacherId) { // 50 ms
        const sql = 'select count(*) as total, teacher_id from teachers_student_subscription where teacher_id = ? and is_active = 1';
        return database.query(sql, [teacherId]);
    }

    static getSubscribedInternalTeachersData(database, studentId) { // 60 -70 ms
        const sql = 'select ctm.faculty_id, GROUP_CONCAT(distinct(ctm.assortment_id)) as assortment_ids, GROUP_CONCAT(distinct(ctm.subject)) as subjects, du.name, du.experience, du.degree, du.college, du.image_url, du.gender, GROUP_CONCAT(distinct(cd.category)) as category from teachers_student_subscription tss inner join course_teacher_mapping ctm on tss.teacher_id = ctm.faculty_id inner join dashboard_users du on du.id = ctm.faculty_id inner join course_details cd on cd.assortment_id = ctm.assortment_id where cd.assortment_type = "course" and cd.is_free = 1 and cd.is_active = 1 and tss.is_active = 1 and tss.student_id = ? group by ctm.faculty_id';
        return database.query(sql, [studentId]);
    }

    static getTeacherVideosInternal(database, teacherId, classMeta, limit) { // 60 - 80 ms
        const sql = 'select cr.* ,cd.category, cd.category_type from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join questions q on q.question_id = cr.resource_reference inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and cd.assortment_type = "resource_video" and (crm.live_at < now() or crm.live_at is null) and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cr.resource_type in (1,4,8) and q.is_answered = 1 group by cr.resource_reference order by crm.live_at desc limit ?';
        return database.query(sql, [teacherId, classMeta, limit]);
    }

    static checkTeacherIsInternal(database, teacherId) { // 20- 30 ms
        const sql = 'select * from dashboard_users where id = ?';
        return database.query(sql, [teacherId]);
    }

    static getDinstinctSubjectAppInternal(database, teacherId, studentClass) { // 50 - 60 ms
        const sql = 'select distinct(cr.subject) from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (cd.assortment_type = "resource_video" or cd.assortment_type = "resource_pdf") and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cr.resource_type in (1,2,4,8)';
        return database.query(sql, [teacherId, studentClass]);
    }

    static getDinstinctCategoriesAppInternal(database, teacherId, studentClass) { // 50 - 60 ms
        const sql = 'select distinct(cd.category) from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (cd.assortment_type = "resource_video" or cd.assortment_type = "resource_pdf") and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cr.resource_type in (1,2,4,8)';
        return database.query(sql, [teacherId, studentClass]);
    }

    static getDistinctFiltersInternal(database, teacherId, classMeta, tabFilter, subFilter) { // 20 - 30 ms
        let sql = '';
        if (tabFilter === 'subject') {
            sql = 'select distinct(cr.resource_type) from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cr.subject = ?';
        }
        if (tabFilter === 'category') {
            sql = 'select distinct(cr.resource_type) from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cd.category = ?';
        }
        return database.query(sql, [teacherId, classMeta, subFilter]);
    }

    static getFilteredResourcesChannelInternal(database, teacherId, classMeta, tabFilter, subFilter, contentfilter, resourceType, limit, offset) { // 30 - 40 ms
        let sql = '';
        if (tabFilter === 'subject') {
            sql = 'select cr.*, cd.category, cd.category_type from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join questions q on q.question_id = cr.resource_reference inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (crm.live_at < now() or crm.live_at is null) and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cr.subject = ? and cr.resource_type in (?) and q.is_answered = 1 group by cr.resource_reference order by cr.created_at desc limit ? offset ?';
        }
        if (tabFilter === 'category') {
            sql = 'select cr.*, cd.category, cd.category_type from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join questions q on q.question_id = cr.resource_reference inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (crm.live_at < now() or crm.live_at is null) and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.class = ? and cd.category = ? and cr.resource_type in (?) and q.is_answered = 1 group by cr.resource_reference order by cr.created_at desc limit ? offset ?';
        }
        return database.query(sql, [teacherId, classMeta, subFilter, resourceType, limit, offset]);
    }

    static getDistinctTeachingDetails(database, teacherId) { // 60 - 90 ms
        const sql = 'select GROUP_CONCAT(distinct(cd.meta_info)) as locale, GROUP_CONCAT(distinct(cr.class)) as class_taught, GROUP_CONCAT(distinct(cd.category)) as category, GROUP_CONCAT(distinct(cr.subject)) as subjects from course_resources cr inner join course_resource_mapping crm on crm.course_resource_id = cr.id inner join course_details cd on cd.assortment_id = crm.assortment_id where cr.faculty_id = ? and crm.resource_type = "resource" and (cr.stream_status = "INACTIVE" or cr.stream_status is null) and cd.is_free = 1 and cd.is_active = 1 and cr.is_active = 1 and cr.resource_type in (1,2,4,8)';
        return database.query(sql, [teacherId]);
    }

    static getTearcherDetailsByCourseAssortment(database, assortmentList) { // 30 ms
        const sql = 'select ctm.faculty_id, ctm.faculty_name, du.name, du.experience, ctm.image_url, ctm.degree, ctm.college, GROUP_CONCAT(distinct(ctm.subject)) as subjects from course_teacher_mapping ctm left join dashboard_users du on du.id = ctm.faculty_id where ctm.assortment_id in (?) group by ctm.faculty_id';
        return database.query(sql, [assortmentList]);
    }

    static getNKCVideoDetails(database) { // 20 ms
        const sql = 'select key_value from app_configuration where key_name = "nkc_video"';
        return database.query(sql);
    }

    static getTeacherDetailsForWeb(database, teacherId) { // 30 ms
        const sql = 'select id, name, image_url, experience, degree, college from dashboard_users where id in (?)';
        return database.query(sql, [teacherId]);
    }

    static getInternalTeacherMappingDetails(database, teacherId) { // 20- 30 ms
        const sql = 'select * from course_teacher_mapping where faculty_id = ?';
        return database.query(sql, [teacherId]);
    }

    static getInternalTeachersForSubject(database, subjectId) {
        const sql = 'select * from dashboard_users where subject = ?';
        return database.query(sql, [subjectId]);
    }

    static getTeacherDetailsByCourse(database, teacherId) { // 20- 30 ms
        const sql = 'select * from course_resources where faculty_id = ? group by faculty_id';
        return database.query(sql, [teacherId]);
    }

    static getInternalTeachersByClass(database, studentClass) {
        const sql = 'select ctm.faculty_id, GROUP_CONCAT(distinct(ctm.assortment_id)) as assortment_ids, GROUP_CONCAT(distinct(ctm.subject)) as subjects, du.name, du.experience, du.degree, du.college, du.image_url, du.gender, GROUP_CONCAT(distinct(cd.category)) as category from course_teacher_mapping ctm inner join course_details cd on cd.assortment_id = ctm.assortment_id left join dashboard_users du on du.id = ctm.faculty_id where cd.is_free = 1 and cd.class = ? and cd.is_active = 1 group by ctm.faculty_id order by ctm.faculty_id';
        return database.query(sql, [studentClass]);
    }

    static getInternalDistinctSubjectsByTeacherAndClass(database, studentClass, teacherId) { // 30 ms
        const sql = 'select distinct(ctm.subject) as subjects from course_teacher_mapping ctm inner join course_details cd on cd.assortment_id = ctm.assortment_id left join dashboard_users du on du.id = ctm.faculty_id where cd.is_free = 1 and cd.class = ? and ctm.faculty_id = ? and cd.is_active = 1';
        return database.query(sql, [studentClass, teacherId]);
    }

    static getTeacherData(database, teacherId) { // 35 ms
        const sql = 'select t.teacher_id, t.img_url, t.fname, t.lname, t.year_of_experience, GROUP_CONCAT(distinct(tsm.subject)) as subjects, GROUP_CONCAT(distinct(tem.exam)) as exam, GROUP_CONCAT(distinct(tbm.board)) as board from teachers t inner join teachers_subject_mapping tsm on tsm.teacher_id = t.teacher_id left join teachers_exam_mapping tem on tem.teacher_id = t.teacher_id left join teachers_board_mapping tbm on tbm.teacher_id = t.teacher_id where t.teacher_id = ? and t.is_verified = 1 and t.is_active = 1 and tem.is_active = 1 and tbm.is_active = 1 and tsm.is_active = 1 group by t.teacher_id';
        return database.query(sql, [teacherId]);
    }
};
