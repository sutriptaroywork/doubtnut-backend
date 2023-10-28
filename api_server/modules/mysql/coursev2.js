const _ = require('lodash');
const moment = require('moment');

module.exports = class Course {
    static getCaraouselDataLandingPage(db, studentClass, locale, category) {
        let sql;
        if (category) {
            sql = 'select * from course_carousel where class=? and is_active=1 and locale=? and category=? order by carousel_order';
            return db.query(sql, [studentClass, locale, category]);
        }
        sql = 'select * from course_carousel where class=? and is_active=1 and locale=? and category is null order by carousel_order';
        return db.query(sql, [studentClass, locale]);
    }

    static getCaraouselDataCoursePage(db, studentClass, locale, versionCode, category) {
        const sql = 'select * from course_carousel where (class=? and is_active=1 and locale=? and category=? and min_version_code <= ? and max_version_code >= ?) order by carousel_order';
        return db.query(sql, [studentClass, locale, category, versionCode, versionCode]);
    }

    static getCaraouselDetails(db, id) {
        const sql = 'select * from course_carousel where id=?';
        return db.query(sql, [id]);
    }

    static checkRewardExistence(db, studentId) {
        const sql = 'SELECT EXISTS(SELECT id FROM wallet_transaction WHERE student_id = ? AND reason in (\'add_attendance_reward\', \'add_topic_booster_reward\')) AS EXIST';
        return db.query(sql, [studentId]);
    }

    static getResourcesWalletPage(db, studentClass, resourceType, walletAmt, language) {
        const sql = `SELECT e.*, g.id AS variant_id, g.package_id, g.display_price, g.base_price FROM
                    (SELECT c.* FROM
                    (SELECT a.id, a.resource_reference, a.expert_name, a.display, b.live_at, b.assortment_id
                    FROM course_resources AS a
                    INNER JOIN course_resource_mapping AS b ON a.id = b.course_resource_id
                    WHERE b.resource_type = 'resource' AND a.resource_type = ? AND a.class = ? AND b.live_at < NOW()
                    GROUP BY b.course_resource_id) AS c
                    INNER JOIN course_details AS d ON c.assortment_id = d.assortment_id
                    WHERE d.is_free = 0 AND is_active = 1 AND d.class = ? AND d.meta_info = '${language}') AS e
                    INNER JOIN package f on f.assortment_id = e.assortment_id
                    INNER JOIN variants g on g.package_id = f.id
                    WHERE f.reference_type = 'v3' AND f.is_active = 1 AND f.type = 'subscription' AND
                    g.is_default = 1 and g.display_price <= ? LIMIT 10`;
        return db.query(sql, [resourceType, studentClass, studentClass, walletAmt]);
    }

    static checkPurchasedPdf(db, packageList, studentId) {
        const sql = `SELECT new_package_id as id FROM student_package_subscription where new_package_id in (${packageList}) and student_id = ?`;
        return db.query(sql, [studentId]);
    }

    static getDistinctCategories(db, studentClass) { // 20ms
        let sql;
        if (+studentClass === 14) {
            sql = "select DISTINCT (category) as id from course_details cc where category is not null and class=? and is_active=1 and assortment_type='course' ";
            return db.query(sql, [studentClass]);
        }
        sql = "select DISTINCT (category) as id from course_details cc where category is not null and class=? and is_active=1 and assortment_type='course' order by FIELD(category, 'NEET', 'IIT JEE', 'CBSE Boards', 'NDA')";
        return db.query(sql, [studentClass]);
    }

    static getAllCourses(db, studentClass, category, offset) {
        let sql; let obj = [];
        if (category) {
            sql = 'select * from course_details where class=? and category=? and assortment_type=\'course\' and is_active=1 order by is_free limit 20 OFFSET ?';
            obj = [studentClass, category, offset];
        } else {
            sql = 'select * from course_details where class=? and assortment_type=\'course\' order by is_free limit 20 OFFSET ?';
            obj = [studentClass, offset];
        }
        return db.query(sql, obj);
    }

    static getAssortmentDetailsFromId(db, assortmentId, studentClass) {
        let sql;
        if (!studentClass) { //* 40ms
            sql = 'select cd.*, vcm.course_id, crm.schedule_type from (select * from course_details where assortment_id in (?)) as cd left join (select assortment_id, schedule_type from course_resource_mapping where assortment_id in (?)) as crm on crm.assortment_id=cd.assortment_id left join (select assortment_id,course_id from vod_class_subject_course_mapping) as vcm on vcm.assortment_id=cd.assortment_id GROUP by cd.assortment_id';
            return db.query(sql, [assortmentId, assortmentId]);
        }
        sql = 'select cd.*,cdlcm.liveclass_course_id  from (select * from course_details where assortment_id in (?)) as cd left join (select assortment_id, liveclass_course_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id group by cd.assortment_id order by FIELD (cd.assortment_id, ?)';
        return db.query(sql, [assortmentId, assortmentId]);
    }

    static getCourseIdForSubjectAssorment(db, assortmentId) {
        const sql = 'SELECT assortment_id FROM course_resource_mapping where course_resource_id =? and resource_type="assortment"';
        return db.query(sql, [assortmentId]);
    }

    static getAssortmentDetailsFromIdForExplorePage(db, assortmentId, studentClass) {
        let sql;
        if (!studentClass) { //* 40ms
            sql = 'select * from course_details where assortment_id in (?) GROUP by assortment_id';
            return db.query(sql, [assortmentId, assortmentId]);
        }
        sql = 'select cd.*,cdlcm.liveclass_course_id,case when cabm.display_name is null then cd.display_name else cabm.display_name end as display_name, case when cabm.demo_video_thumbnail is null then cd.demo_video_thumbnail else cabm.demo_video_thumbnail end as demo_video_thumbnail from (select * from course_details where assortment_id in (?) and is_active=1) as cd left join (select assortment_id, liveclass_course_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id left join (select assortment_id as batch_table_assortment_id, display_name, demo_video_thumbnail from course_assortment_batch_mapping where is_active=1) as cabm on cabm.batch_table_assortment_id=cd.assortment_id group by cd.assortment_id';
        return db.query(sql, [assortmentId, studentClass]);
    }

    static getAssortmentDetailsFromIdForMyCoursesCarousel(db, assortmentId) {
        const sql = 'select cd.*,cdlcm.liveclass_course_id,case when cabm.display_name is null then cd.display_name else cabm.display_name end as display_name, case when cabm.demo_video_thumbnail is null then cd.demo_video_thumbnail else cabm.demo_video_thumbnail end as demo_video_thumbnail from (select * from course_details where assortment_id in (?)) as cd left join (select assortment_id, liveclass_course_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id left join (select assortment_id as batch_table_assortment_id, display_name, demo_video_thumbnail from course_assortment_batch_mapping) as cabm on cabm.batch_table_assortment_id=cd.assortment_id group by cd.assortment_id';
        return db.query(sql, [assortmentId]);
    }

    static getChildAssortments(db, assortmentId) {
        const sql = 'select x.*, y.live_at from (select course_resource_id, resource_type, live_at, class from course_resource_mapping as a inner join course_details as b on a.assortment_id=b.assortment_id where a.assortment_id in (?) and a.resource_type=\'assortment\' group by course_resource_id) as x left join (select * from course_resource_mapping where resource_type=\'resource\') as y on x.course_resource_id=y.course_resource_id';
        // console.log(sql);
        return db.query(sql, [assortmentId]);
    }

    static getResourceDetailsFromId(db, assortmentIds, resourceTypes, studentClass, batchID) {
        const sql = 'select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like \'resource%\' and class=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at<=CURRENT_TIMESTAMP and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id order by b.live_at desc limit 20';
        // console.log(sql);
        return db.query(sql, [assortmentIds, studentClass, batchID, resourceTypes]);
    }

    static getAllResourceDetailsFromAssortmentIdV1(db, assortmentIds, resourceTypes, studentClass, subject, offset, batchID) {
        let sql;
        if (subject) {
            sql = "select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?) and subject=?) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc, a.is_free limit 20 OFFSET ?;";
            return db.query(sql, [assortmentIds, studentClass, batchID, resourceTypes, subject, offset]);
        }
        sql = "select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc, a.is_free limit 20 OFFSET ?;";
        // console.log(sql);
        return db.query(sql, [assortmentIds, studentClass, batchID, resourceTypes, offset]);
    }

    static getAllResourceDetailsFromAssortmentId(db, assortmentIds, resourceTypes, studentClass, subject, offset) {
        let sql;
        if (subject) {
            sql = "select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and is_replay=0) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?) and subject=?) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc, a.is_free limit 20 OFFSET ?;";
            return db.query(sql, [assortmentIds, studentClass, resourceTypes, subject, offset]);
        }
        sql = "select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and is_replay=0) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc, a.is_free limit 20 OFFSET ?;";
        // console.log(sql);
        return db.query(sql, [assortmentIds, studentClass, resourceTypes, offset]);
    }

    static getResourceDataFromAssortmentId(db, assortmentIds, studentClass, offset) {
        const sql = "select c.*, a.assortment_id, a.is_free from (select assortment_id, display_name, is_free from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and is_replay=0) as b on a.assortment_id=b.assortment_id inner join (select case when player_type='youtube' and resource_type in (1,4,8) then meta_info else resource_reference end as resource_data,id,display from course_resources) as c on b.course_resource_id=c.id order by a.is_free limit 20 OFFSET ?;";
        // console.log(sql);
        return db.query(sql, [assortmentIds, studentClass, offset]);
    }

    static getPastResourceDetailsFromAssortmentId(db, assortmentIds, resourceTypes, studentClass, subject, offset, batchID) {
        let sql;
        if (subject) {
            sql = "select c.*,b.live_at, a.assortment_id, a.is_free,a.category, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free,category from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and live_at<=CURRENT_TIMESTAMP and is_replay=0 and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?) and subject=?) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc limit 20 OFFSET ?";
            return db.query(sql, [assortmentIds, studentClass, batchID, resourceTypes, subject, offset]);
        }
        sql = "select c.*,b.live_at, a.assortment_id, a.is_free,a.category, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free,category from course_details where assortment_id in (?) and assortment_type like 'resource%' and class=?) as a inner join (select * from course_resource_mapping where resource_type='resource' and live_at<=CURRENT_TIMESTAMP and is_replay=0 and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at desc limit 20 OFFSET ?;";
        // console.log(sql);
        return db.query(sql, [assortmentIds, studentClass, batchID, resourceTypes, offset]);
    }

    static getRecordedResourceDetailsFromAssortmentId(db, assortmentIds, resourceTypes, studentClass, subject, offset) {
        let sql;
        if (subject) {
            sql = 'select c.*,b.live_at,l.duration, a.assortment_id, a.is_free, a.parent, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free, parent from course_details where assortment_id in (?) and assortment_type like \'resource%\' and class=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\') as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?) and subject=\'?\') as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject,degree, image_url from dashboard_users) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference ORDER BY RAND() limit 20 OFFSET ?;';
            return db.query(sql, [assortmentIds, studentClass, resourceTypes, subject, offset]);
        }
        sql = 'select c.*,b.live_at,l.duration, a.assortment_id, a.is_free,a.parent, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free, parent from course_details where assortment_id in (?) and assortment_type like \'resource%\' and class=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\') as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree,image_url from dashboard_users) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference ORDER BY RAND() limit 20 OFFSET ?;';
        return db.query(sql, [assortmentIds, studentClass, resourceTypes, offset]);
    }

    static getRecordedResourceForEtoos(db, assortmentIds, resourceTypes, studentClass, offset) {
        const sql = 'select c.*,b.live_at,l.duration, a.assortment_id,1 as is_free,a.parent,crm.assortment_id as masterAssortment, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free, parent from course_details where assortment_id in (?) and assortment_type in (\'resource_pdf\', \'resource_test\', \'resource_video\') and class=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\') as b on a.assortment_id=b.assortment_id inner join (select assortment_id,course_resource_id from course_resource_mapping where resource_type=\'assortment\') as crm on crm.course_resource_id=b.assortment_id inner join (select assortment_id from course_details where is_free=0 and assortment_type=\'chapter\' and class=?) as cd on cd.assortment_id=crm.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree,image_url from dashboard_users) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id from answers where question_id<>0) as l on l.question_id=c.resource_reference limit 10 OFFSET ?;';
        return db.query(sql, [assortmentIds, studentClass, studentClass, resourceTypes, offset]);
    }

    static getUpcomingResourcesFromAssortmentId(db, assortmentIds, resourceTypes, studentClass, subject, offset, batchID) {
        let sql; let obj = [];
        if (subject) {
            sql = 'select c.*,b.live_at, a.assortment_id, a.is_free,a.category, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free,category from course_details where assortment_id in (?) and assortment_type like \'resource%\' and class=) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)>=hour(CURRENT_TIMESTAMP))) and is_replay=0 and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?) and subject=?) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at limit 20 OFFSET ?;';
            obj = [assortmentIds, studentClass, batchID, resourceTypes, subject, offset];
        } else {
            sql = 'select c.*,b.live_at, a.assortment_id, a.is_free,a.category, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free,category from course_details where assortment_id in (?) and assortment_type like \'resource%\' and class=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)>=hour(CURRENT_TIMESTAMP))) and is_replay=0 and batch_id=?) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference order by b.live_at limit 20 OFFSET ?;';
            obj = [assortmentIds, studentClass, batchID, resourceTypes, offset];
        }
        return db.query(sql, obj);
    }

    static getRelatedAssortments(db, assortmentId, studentClass) {
        const sql = 'select distinct(a.assortment_id) as assortment_id from course_resource_mapping as a join course_details as b on a.assortment_id=b.assortment_id and b.is_active=1 where a.course_resource_id in (?) and resource_type=\'assortment\' and b.class=?';
        // console.log(sql);
        return db.query(sql, [assortmentId, studentClass]);
    }

    static getUserSubscriptionByAssortment(db, assortment) {
        const sql = 'select * from (select * from package where assortment_id in (?)) as a left join student_package_subscription as b on a.id=b.new_package_id order by b.id';
        // console.log(sql);
        return db.query(sql, [assortment]);
    }

    static getUserPaymentSummaryByAssortment(db, assortment, studentId) {
        const sql = 'select * from (select * from package where assortment_id in (?) and type=\'emi\') as a join (select * from payment_summary where student_id=? and CURRENT_DATE >= master_subscription_start_date and CURRENT_DATE <= master_subscription_end_date) as b on a.id=b.new_package_id order by b.id';
        // console.log(sql);
        return db.query(sql, [assortment, studentId]);
    }

    // exec time - 25-30ms
    static getUserPaymentSummaryDetailsByAssortment(db, assortment, studentId) {
        const sql = 'select a.duration_in_days, b.package_amount, b.subscription_id, b.new_package_id from (select * from package where assortment_id=? and reference_type in (\'v3\', \'onlyPanel\')) as a inner join (select * from payment_summary where student_id=? and CURRENT_DATE <= master_subscription_end_date and next_package_id is null and is_refunded is null) as b on a.id=b.new_package_id order by b.id';
        return db.query(sql, [assortment, studentId]);
    }

    static getUserPaymentSummaryDetailsByAssortmentV1(db, assortment, studentId) {
        const sql = 'select a.duration_in_days, b.package_amount, b.subscription_id, b.new_package_id, b.amount_paid, b.id as ps_id  from (select * from package where assortment_id=? and reference_type in (\'v3\', \'onlyPanel\', \'referral\',\'bnb_autosales\')) as a inner join (select ps.* from payment_summary ps join student_package_subscription sps on ps.subscription_id = sps.id where ps.student_id=? and CURRENT_DATE <= ps.master_subscription_end_date and ps.next_package_id is null and ps.is_refunded is null and sps.is_active = 1) as b on a.id=b.new_package_id order by b.id';
        return db.query(sql, [assortment, studentId]);
    }

    static getUserPaymentSummaryDetailsByAssortmentV1Panel(db, assortment, studentId) {
        const sql = 'select a.duration_in_days, b.package_amount, b.subscription_id, b.new_package_id, b.amount_paid, b.id as ps_id from (select * from package where assortment_id=? and reference_type in (\'v3\', \'onlyPanel\', \'referral\',\'bnb_autosales\')) as a inner join (select * from payment_summary where student_id=? and (CURRENT_DATE <= DATE_ADD(master_subscription_end_date, INTERVAL 30 day)) and next_package_id is null and is_refunded is null) as b on a.id=b.new_package_id order by b.id';
        return db.query(sql, [assortment, studentId]);
    }

    static getUserPaymentSummaryDetailsByAssortmentV1AllPurchases(db, assortment, studentId) {
        const sql = 'select a.duration_in_days, b.package_amount, b.subscription_id, b.new_package_id, b.amount_paid, b.id as ps_id, b.next_ps_id, b.payment_type from (select * from package where assortment_id=? and reference_type in (\'v3\', \'onlyPanel\', \'referral\',\'bnb_autosales\')) as a inner join (select * from payment_summary where student_id=? and is_refunded is null) as b on a.id=b.new_package_id order by b.id desc';
        return db.query(sql, [assortment, studentId]);
    }

    static getUserEmiPackages(db, studentId) {
        const sql = "select * from (select * from package where type='emi') as a inner join (select * from student_package_subscription where student_id=? and is_active=1 and end_date >= CURRENT_DATE) as b on a.id=b.new_package_id inner join (select * from payment_summary where student_id=?) as c on c.subscription_id=b.id left join (select master_parent_variant_id, id as next_variant_id,package_id from variants where master_parent_variant_id is not null) as v on v.master_parent_variant_id=c.master_variant_id inner join (select id,parent from package where type='emi') as p on p.id=v.package_id and p.parent=c.new_package_id order by b.id ;";
        // console.log(sql);
        return db.query(sql, [studentId, studentId]);
    }

    static getUserEmiReminder(db, studentId) {
        const sql = 'select * from payment_summary where student_id=? and CURRENT_DATE >= master_subscription_start_date and CURRENT_DATE <= master_subscription_end_date group by master_package_id';
        // console.log(sql);
        return db.query(sql, [studentId]);
    }

    static getUserActivePackages(database, studentID) { // * 60 ms
        const sql = 'select * from (select *, id as subscription_id,is_active as sps_is_active from student_package_subscription where student_id=? and start_date < now() and end_date > now() and is_active=1 order by id desc) as a inner join (select * from package where reference_type in (\'v3\', \'onlyPanel\', \'default\',\'referral\',\'bnb_autosales\')) as b on a.new_package_id=b.id left join (select class,assortment_id, assortment_type,display_name, year_exam,display_description,category,meta_info,category_type from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getUserExpiredPackages(database, studentID) {
        const sql = 'select * from (select * from student_package_subscription where student_id=? and amount>-1 and end_date < now()) as a inner join (select * from package where reference_type in (\'v3\', \'onlyPanel\', \'default\')) as b on a.new_package_id=b.id left join (select assortment_id, assortment_type from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getUserExpiredPackagesIncludingTrial(database, studentID) {
        const sql = 'select * from (select * from student_package_subscription where student_id=? and end_date < now()) as a inner join (select * from package where reference_type in (\'v3\', \'onlyPanel\', \'default\',\'referral\',\'bnb_autosales\')) as b on a.new_package_id=b.id left join (select assortment_id, assortment_type from course_details) as cd on cd.assortment_id=b.assortment_id group by cd.assortment_id order by a.id desc';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getUserAllPurchasedPackages(database, studentID) {
        const sql = 'select * from (select * from student_package_subscription where student_id=? and amount >=-1 order by id desc) as a inner join (select id, type, assortment_id from package where reference_type in (\'v3\', \'onlyPanel\', \'default\',\'referral\',\'bnb_autosales\')) as b on a.new_package_id=b.id left join (select class,assortment_id, assortment_type,display_name from course_details) as cd on cd.assortment_id=b.assortment_id group by a.created_at,cd.assortment_id order by a.id desc';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getUserPackagesByAssortment(database, studentID, assortmentId) {
        const sql = "select * from (select *,id as subscription_id from student_package_subscription where student_id=?) as a inner join (select id,assortment_id, batch_id, type, duration_in_days from package where reference_type in ('v3', 'onlyPanel', 'default','referral','bnb_autosales') and assortment_id=?) as b on a.new_package_id=b.id";
        // console.log(sql);
        return database.query(sql, [studentID, assortmentId]);
    }

    static getUserActivePackagesByAssortment(database, studentID, assortmentId) {
        const sql = "select * from (select * from student_package_subscription where student_id=? and is_active=1 and start_date< now() and end_date > now()) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default', 'referral','bnb_autosales') and assortment_id=?) as b on a.new_package_id=b.id";
        // console.log(sql);
        return database.query(sql, [studentID, assortmentId]);
    }

    static getUserActivePackagesByClass(database, studentID, studentClass) {
        const sql = "select * from (select * from student_package_subscription where student_id=? and is_active=1 and start_date< now() and end_date > now()) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default','referral','bnb_autosales')) as b on a.new_package_id=b.id inner join (select assortment_id,assortment_type from course_details where class=?) as c on c.assortment_id=b.assortment_id";
        // console.log(sql);
        return database.query(sql, [studentID, studentClass]);
    }

    static getStudentAssortmentProgress(database, studentID, assortmentId) {
        const sql = 'select * from student_assortment_progress where student_id=? and assortment_id=?';
        console.log(sql);
        return database.query(sql, [studentID, assortmentId]);
    }

    static getOtherStudentsAssortmentProgress(database, studentID, assortmentId) {
        const sql = 'select max(total_count) as total_count from student_assortment_progress where student_id<>? and assortment_id=?';
        console.log(sql);
        return database.query(sql, [studentID, assortmentId]);
    }

    static getUserActivePackagesWithAssortment(database, studentID, studentClass) {
        const sql = 'select a.*,b.assortment_id,b.created_at as purchase_date,b.name,c.assortment_type,b.batch_id from (select * from student_package_subscription where student_id=? and start_date < now() and end_date > now() and is_active=1 order by id desc) as a inner join (select * from package) as b on a.new_package_id=b.id inner join (select assortment_type, assortment_id from course_details where class=?) as c on b.assortment_id=c.assortment_id';
        // console.log(sql);
        return database.query(sql, [studentID, studentClass]);
    }

    static getUserSubscription(db, studentID) {
        const sql = 'select *, a.is_active as sub_active from (select * from student_package_subscription where student_id = ?) as a inner join package as b on a.new_package_id = b.id order by a.id';
        // console.log(sql);
        return db.query(sql, [studentID]);
    }

    static getResourcesByAssortmentList(database, assortmentIDArray, startDate, endDate, batchID) {
        const sql = 'select *, DAYOFWEEK(live_at) as week, day(live_at) as day, month(live_at) as month, year(live_at) as year from (select assortment_id,course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (?) and (schedule_type<>\'recorded\' and  (live_at >=? and live_at <= ?) and resource_type=\'resource\' and is_replay=0 and batch_id=?)) as a inner join (select assortment_id, is_free from course_details) as f on a.assortment_id=f.assortment_id left join (select id, display, resource_type, resource_reference, subject,player_type, concat(case when resource_type in (1,4,8) then \'VIDEO\' when resource_type in (2,3) then \'PDF\' else \'TEST\' end ,\' | \',subject,\' | \',chapter) as title, description, stream_status as is_active, image_url as image_bg_liveclass from course_resources where resource_type <> 7) as b on a.course_resource_id=b.id where b.id is not null group by f.assortment_id';
        return database.query(sql, [assortmentIDArray, startDate, endDate, batchID]);
    }

    static getResourcesByAssortmentListWithoutNotes(database, assortmentIDArray, startDate, endDate, studentID, batchID) {
        const sql = 'select *, DAYOFWEEK(live_at) as week, day(live_at) as day, month(live_at) as month, year(live_at) as year from (select assortment_id,course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (?) and (schedule_type<>\'recorded\' and  (live_at >=? and live_at <= ?) and resource_type=\'resource\' and is_replay=0 and batch_id=?)) as a inner join (select assortment_id, is_free from course_details) as f on a.assortment_id=f.assortment_id left join (select id, display, resource_type, resource_reference, subject,player_type, concat(case when resource_type in (1,4,8) then \'VIDEO\' else \'TEST\' end ,\' | \',subject,\' | \',chapter) as title, description,stream_start_time, stream_status as is_active, image_url as image_bg_liveclass, case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type=9 or (resource_type in (1,8) and stream_end_time is not null) or (resource_type in (1,4) and stream_end_time is null)) as b on a.course_resource_id=b.id left join (select is_vdo_ready,vdo_cipher_id,question_id,duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id left join (select is_view, resource_reference as question_id from liveclass_subscribers where student_id=?) as ls on ls.question_id=b.resource_reference_id left join (select duration_in_min, no_of_questions, test_id,title as test_title from testseries) as ts on ts.test_id=b.resource_reference left join (SELECT test_id, status,completed_at FROM testseries_student_subscriptions WHERE student_id = ? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id where b.id is not null group by f.assortment_id order by a.live_at desc';
        return database.query(sql, [assortmentIDArray, startDate, endDate, batchID, studentID, studentID]);
    }

    static getAssortmentsByAssortmentList(database, assortmentIDArray) {
        const sql = 'select * from (select assortment_id,course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (?) and schedule_type<>\'recorded\' and resource_type=\'assortment\') as a inner join (select assortment_id, is_free from course_details) as f on a.assortment_id=f.assortment_id group by a.course_resource_id;';
        return database.query(sql, [assortmentIDArray]);
    }

    static getAssortmentsByAssortmentListWithoutNotes(database, assortmentIDArray, startDate, endDate) {
        const sql = 'select * from (select assortment_id,course_resource_id, resource_type as assortment_type from course_resource_mapping where assortment_id in (?) and schedule_type<>\'recorded\' and resource_type=\'assortment\') as a inner join (select assortment_id, is_free from course_details where assortment_type<>\'resource_pdf\') as f on a.assortment_id=f.assortment_id inner join (select assortment_id, assortment_type as a_type from course_details where assortment_type<>\'resource_pdf\') as cd on cd.assortment_id=a.course_resource_id left join (select  assortment_id,live_at from course_resource_mapping where resource_type=\'resource\' and (live_at >=? and live_at <= ?)) as crm on crm.assortment_id=a.course_resource_id group by a.course_resource_id;';
        return database.query(sql, [assortmentIDArray, startDate, endDate]);
    }

    static getAssortmentsByAssortmentListForTimeline(database, assortmentIDArray, offset, batchID, assortmentType) {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select b.course_resource_id from (select assortment_id,course_resource_id, resource_type from course_resource_mapping where assortment_id=? and schedule_type<>\'recorded\' and resource_type=\'assortment\') as a inner join (select assortment_id,course_resource_id from course_resource_mapping where resource_type=\'assortment\') as b on a.course_resource_id=b.assortment_id inner join (select  assortment_id,course_resource_id,live_at from course_resource_mapping where resource_type=\'resource\' and live_at <= now() and batch_id=?) as crm on crm.assortment_id=b.course_resource_id INNER join course_resources cr on crm.course_resource_id = cr.id and cr.resource_type in (1,4,8,9) order by crm.live_at desc limit 30 offset ?;';
            return database.query(sql, [assortmentIDArray, batchID, offset]);
        }
        if (assortmentType === 'chapter') {
            sql = 'select a.course_resource_id from (select assortment_id,course_resource_id, resource_type from course_resource_mapping where assortment_id=? and schedule_type<>\'recorded\' and resource_type=\'assortment\') as a inner join (select  assortment_id,course_resource_id,live_at from course_resource_mapping where resource_type=\'resource\' and live_at <= now() and batch_id=?) as crm on crm.assortment_id=a.course_resource_id INNER join course_resources cr on crm.course_resource_id = cr.id and cr.resource_type in (1,4,8,9) order by crm.live_at desc limit 30 offset ?;';
            return database.query(sql, [assortmentIDArray, batchID, offset]);
        }
        sql = `select
        c.course_resource_id
    from
        (
        select
            assortment_id,
            course_resource_id,
            resource_type
        from
            course_resource_mapping
        where
            assortment_id = ?
            and schedule_type <> 'recorded'
            and resource_type = 'assortment') as a
    inner join (
        select
            assortment_id,
            course_resource_id
        from
            course_resource_mapping
        where
            resource_type = 'assortment') as b on
        a.course_resource_id = b.assortment_id
    inner join (
        select
            assortment_id,
            course_resource_id
        from
            course_resource_mapping
        where
            resource_type = 'assortment') as c on
        b.course_resource_id = c.assortment_id
    inner join (
        select
            assortment_id,
            course_resource_id,
            live_at
        from
            course_resource_mapping
        where
            resource_type = 'resource'
            and live_at <= now()
            and batch_id =?) as crm on
        crm.assortment_id = c.course_resource_id
        INNER join course_resources cr on crm.course_resource_id = cr.id and cr.resource_type in (1,4,8,9)
    order by
        crm.live_at desc limit 30 offset ?
    `;
        return database.query(sql, [assortmentIDArray, batchID, offset]);
    }

    static getResourcesByAssortmentListForTimeline(database, assortmentIDArray, studentID, batchID) {
        const sql = 'select *, DAYOFWEEK(live_at) as week, day(live_at) as day, month(live_at) as month, year(live_at) as year from (select assortment_id,course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (?) and schedule_type<>\'recorded\' and resource_type=\'resource\' and is_replay=0 and batch_id=?) as a inner join (select assortment_id, is_free from course_details) as f on a.assortment_id=f.assortment_id left join (select id, display, resource_type, resource_reference, subject,player_type, concat(case when resource_type in (1,4,8) then \'VIDEO\' else \'TEST\' end ,\' | \',subject,\' | \',chapter) as title, description,stream_start_time, stream_status as is_active, image_url as image_bg_liveclass, case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type=9 or (resource_type in (1,8) and stream_end_time is not null) or (resource_type in (1,4) and stream_end_time is null)) as b on a.course_resource_id=b.id left join (select is_vdo_ready,vdo_cipher_id,question_id,duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id left join (select is_view, resource_reference as question_id from liveclass_subscribers where student_id=?) as ls on ls.question_id=b.resource_reference_id left join (select duration_in_min, no_of_questions, test_id,title as test_title from testseries) as ts on ts.test_id=b.resource_reference left join (SELECT test_id, status,completed_at FROM testseries_student_subscriptions WHERE student_id = ? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id where b.id is not null group by f.assortment_id order by a.live_at desc';
        return database.query(sql, [assortmentIDArray, batchID, studentID, studentID]);
    }

    static getAllParentAssortments(database, assortmentIDArray) {
        const sql = 'select assortment_id,course_resource_id from course_resource_mapping where course_resource_id in (?) and resource_type=\'assortment\'';
        // console.log(sql);
        return database.query(sql, [assortmentIDArray]);
    }

    static getAllParentAssortmentsWithDetails(database, assortmentIDArray) {
        const sql = 'select * from (select assortment_id,course_resource_id from course_resource_mapping where course_resource_id in (?) and resource_type=\'assortment\') as a left join (select assortment_id, display_name from course_details) as b on b.assortment_id=a.assortment_id';
        // console.log(sql);
        return database.query(sql, [assortmentIDArray]);
    }

    static getPastData(database, assortmentIDArray, startDate) {
        const sql = 'select course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and live_at <= ?';
        return database.query(sql, [assortmentIDArray, startDate]);
    }

    static getFutureData(database, assortmentIDArray, endDate) {
        const sql = 'select course_resource_id,live_at, resource_type as assortment_type from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and live_at >= ?';
        // console.log(sql);
        return database.query(sql, [assortmentIDArray, endDate]);
    }

    static getList(database, facultyID) {
        // const sql = 'select *, a.id as resource_id from (select * from course_resources where faculty_id=? and resource_type=4 and (stream_status is null or stream_status = \'ACTIVE\')) as a inner join (select * from course_resource_mapping where live_at >= CURDATE() and live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY) and resource_type=\'RESOURCE\') as b on a.id=b.course_resource_id group by a.id, a.class,a.subject,a.resource_reference,a.resource_type,b.live_at,a.stream_push_url,a.old_detail_id,a.stream_status order by b.live_at asc';
        const sql = 'select *, a.id as resource_id from (select * from course_resources where faculty_id=? and resource_type=4 and (stream_status is null or stream_status = \'ACTIVE\')) as a inner join (select crm.*, cd.is_free from course_resource_mapping as crm left join course_details as cd on crm.assortment_id = cd.assortment_id where crm.live_at >= CURDATE() and crm.live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY) and crm.resource_type=\'RESOURCE\') as b on a.id=b.course_resource_id group by a.id, a.class,a.subject,a.resource_reference,a.resource_type,b.live_at,a.stream_push_url,a.old_detail_id,a.stream_status order by b.live_at asc';
        console.log(sql);
        return database.query(sql, [facultyID]);
    }

    static updateResource(database, resourceID, resourceReference) {
        const query = 'update course_resources set resource_reference = ? where id=?';
        // console.log(query);
        return database.query(query, [resourceReference, resourceID]);
    }

    static updateStreamPushurl(database, resourceID, pushUrl) {
        const sql = 'update course_resources set stream_push_url = ? where id=?';
        // console.log(sql);
        return database.query(sql, [pushUrl, resourceID]);
    }

    static updateStreamStartTime(database, resourceID) {
        const sql = 'update course_resources set stream_start_time = CURRENT_TIMESTAMP(), stream_status=\'ACTIVE\' where id=?';
        // console.log(sql);
        return database.query(sql, [resourceID]);
    }

    static updateStreamEndTime(database, resourceID) {
        const sql = 'update course_resources set stream_end_time = CURRENT_TIMESTAMP(), stream_status=\'INACTIVE\' where id=?';
        // console.log(sql);
        return database.query(sql, [resourceID]);
    }

    static getResourceByID(database, resourceID) {
        const sql = 'select * from course_resources where id=?';
        // console.log(sql);
        return database.query(sql, [resourceID]);
    }

    static updateAnswerVideo(database, questionID, url) {
        const query = 'update answers set answer_video = ?, is_vdo_ready = 3 where question_id=?';
        // console.log(query);
        return database.query(query, [url, questionID]);
    }

    static updateVodUrl(database, resourceID, url) {
        const query = 'update course_resources set stream_vod_url = ? where id=?';
        // console.log(query);
        return database.query(query, [url, resourceID]);
    }

    static addResource(database, data) {
        console.log(data);
        const query = 'INSERT INTO course_resources set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static addPdfDownloadStats(database, data) {
        const query = 'INSERT INTO pdf_download_stats set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static getPdfDownloadStats(database, studentID, resourceID) {
        const query = 'Select * from pdf_download_stats where student_id=? and resource_id=? limit 1';
        console.log(query);
        return database.query(query, [studentID, resourceID]);
    }

    static videoViewCheck(database, questionID, studentID, viewId) {
        const query = 'Select * from video_view_stats where student_id=? and question_id=? and view_id!=? limit 2';
        console.log(query);
        return database.query(query, [studentID, questionID, viewId]);
    }

    static updatePdfCount(database, studentID, assortmentId) {
        const query = 'UPDATE student_assortment_progress set pdf_count=pdf_count+1, total_count=total_count+1, updated_at=CURRENT_TIMESTAMP where student_id=? and assortment_id=?';
        console.log(query);
        return database.query(query, [studentID, assortmentId]);
    }

    static setPdfCount(database, data) {
        const query = 'INSERT INTO student_assortment_progress set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static updateVideoCount(database, studentID, assortmentId, videoTime) {
        const query = 'UPDATE student_assortment_progress set videos_count=videos_count+1,total_count=total_count+1,updated_at=CURRENT_TIMESTAMP,videos_engage_time=? where student_id=? and assortment_id=?';
        console.log(query);
        return database.query(query, [videoTime, studentID, assortmentId]);
    }

    static updateVideoWatched(database, studentID, assortmentId, watchedVideo, videoTime) {
        const query = 'UPDATE student_assortment_progress set video_history=?,videos_count=videos_count+1,total_count=total_count+1,updated_at=CURRENT_TIMESTAMP,videos_engage_time=? where student_id=? and assortment_id=?';
        console.log(query);
        return database.query(query, [watchedVideo, videoTime, studentID, assortmentId]);
    }

    static setVideoCount(database, data) {
        const query = 'INSERT INTO student_assortment_progress set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static updateTestCount(database, studentID, assortmentId) {
        const query = 'UPDATE student_assortment_progress set test_count=test_count+1,total_count=total_count+1,updated_at=CURRENT_TIMESTAMP where student_id=? and assortment_id=?';
        console.log(query);
        return database.query(query, [studentID, assortmentId]);
    }

    static setTestCount(database, data) {
        const query = 'INSERT INTO student_assortment_progress set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static getUserProgress(database, studentID, assortmentId) {
        const query = 'Select * from student_assortment_progress where student_id=? and assortment_id=?';
        console.log(query);
        return database.query(query, [studentID, assortmentId]);
    }

    static updateQuestionAnswered(database, questionID) {
        const sql = 'update questions set is_answered=1 where question_id=?';
        console.log(sql);
        return database.query(sql, [questionID]);
    }

    static getAssortmentIDs(database, resourceID) {
        const sql = 'select * from course_resource_mapping where course_resource_id=? and resource_type=\'RESOURCE\'';
        console.log(sql);
        return database.query(sql, [resourceID]);
    }

    static getScheduleType(database, assortmentID) {
        const sql = 'select * from course_resource_mapping where assortment_id=? and resource_type=\'RESOURCE\'';
        console.log(sql);
        return database.query(sql, [assortmentID]);
    }

    static getQuizResourceByResourceID(database, assortmentID) {
        const sql = 'select b.*, b.id as resource_id from (select * from course_resource_mapping where assortment_id=? and resource_type=\'RESOURCE\') as a inner join (select * from course_resources where resource_type=7) as b on a.course_resource_id=b.id';
        console.log(sql);
        return database.query(sql, [assortmentID]);
    }

    static getFreeResourceDetailsFromAssortmentId(database, assortmentId, studentClass, offset) {
        const sql = 'select *,f.nickname, c.id as resource_id,case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name,a.assortment_id as video_assortment, crm.assortment_id as chapter_assortment from (select course_resource_id,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) and resource_type=\'assortment\') and resource_type=\'assortment\') as crm inner join (select * from course_resource_mapping where schedule_type=\'recorded\' and is_replay=0 and resource_type=\'resource\') as a on a.assortment_id=crm.course_resource_id inner join (select assortment_id, is_free from course_details where class=? and is_free=1) as b on a.assortment_id=b.assortment_id join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources) as c on a.course_resource_id=c.id and c.resource_type in (1,8) left join (select name as faculty_name, id, subject as faculty_subject, degree, college,image_bg_liveclass,image_url,nickname from dashboard_users) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference_id and c.resource_type in (1,8) order by a.live_at DESC limit 10 offset ?;';
        return database.query(sql, [assortmentId, studentClass, offset]);
    }

    static getResourceDetailsFromAssortmentId(database, assortmentIds, limit, page, subject, studentClass, scheduleType, batchID) {
        let sql;
        if (scheduleType === 'recorded') {
            if (subject === 'ALL') {
                sql = 'select *,c.id as resource_id,case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name from (select * from course_resource_mapping where assortment_id in (?) and ((schedule_type=\'scheduled\' and live_at<NOW()) or schedule_type=\'recorded\') and is_replay=0 and resource_type=\'resource\') as a inner join (select assortment_id, is_free, parent from course_details where class=?) as b on a.assortment_id=b.assortment_id join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources) as c on a.course_resource_id=c.id and c.resource_type in (1,4,8,9) left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference_id left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id order by c.q_order LIMIT ? OFFSET ?;';
                return database.query(sql, [assortmentIds, studentClass, limit, page]);
            }
            sql = 'select * ,c.id as resource_id, case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_nam from (select * from course_resource_mapping where assortment_id in (?) and ((schedule_type=\'scheduled\' and live_at<NOW()) or schedule_type=\'recorded\') and is_replay=0 and resource_type=\'resource\') as a inner join (select assortment_id, is_free from course_details where class=?) as b on a.assortment_id=b.assortment_id inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources) as c on a.course_resource_id=c.id and c.subject=? and c.resource_type in (1,4,8,9) and c.id is not null left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference_id left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id order by c.q_order LIMIT ? OFFSET ?;';
            return database.query(sql, [assortmentIds, studentClass, subject, limit, page]);
        } if (subject === 'ALL') {
            sql = 'select *,c.id as resource_id,case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name,a.assortment_id as video_assortment from (select * from course_resource_mapping where assortment_id in (?) and ((schedule_type=\'scheduled\' and live_at<NOW()) or schedule_type=\'recorded\') and is_replay=0 and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id, is_free from course_details where class=?) as b on a.assortment_id=b.assortment_id join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources) as c on a.course_resource_id=c.id and c.resource_type in (1,4,8,9) left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference_id and c.resource_type in (1,4,8)order by a.live_at DESC LIMIT ? OFFSET ?;';
            return database.query(sql, [assortmentIds, batchID, studentClass, limit, page]);
        }
        sql = 'select * ,c.id as resource_id, case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name, a.assortment_id as video_assortment from (select * from course_resource_mapping where assortment_id in (?) and ((schedule_type=\'scheduled\' and live_at<NOW()) or schedule_type=\'recorded\') and is_replay=0 and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id, is_free from course_details where class=?) as b on a.assortment_id=b.assortment_id inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources) as c on a.course_resource_id=c.id and c.subject=? and c.resource_type in (1,4,8,9) and c.id is not null left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference_id and c.resource_type in (1,4,8) order by a.live_at DESC LIMIT ? OFFSET ?;';
        return database.query(sql, [assortmentIds, batchID, studentClass, subject, limit, page]);
    }

    static getUpcomingResourceDetailsFromAssortmentId(database, assortmentIds, limit, page, subject, studentClass, batchID) {
        let sql;
        if (subject === 'ALL') {
            sql = 'select *,c.id as resource_id, case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name from (select * from course_resource_mapping where assortment_id in (?) and schedule_type=\'scheduled\' and live_at>NOW() and is_replay=0 and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id,is_free from course_details where class=?) as b on a.assortment_id=b.assortment_id inner join course_resources as c on a.course_resource_id=c.id and c.resource_type in (1,4,8,9) left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference and c.resource_type in (1,4,8) left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id order by a.live_at LIMIT ? OFFSET ?;';
            return database.query(sql, [assortmentIds, batchID, studentClass, limit, page]);
        }
        sql = 'select *,c.id as resource_id, case when f.faculty_name is null then c.expert_name else f.faculty_name end as mapped_faculty_name from (select * from course_resource_mapping where assortment_id in (?) and schedule_type=\'scheduled\' and live_at>NOW() and is_replay=0 and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id,is_free from course_details where class=?) as b on a.assortment_id=b.assortment_id inner join course_resources as c on a.course_resource_id=c.id and c.subject=? and c.resource_type in (1,4,8,9) and c.id is not null left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id left join (select question_id,duration,answer_id,is_vdo_ready,vdo_cipher_id from answers where question_id<>0) as l on l.question_id=c.resource_reference and c.resource_type in (1,4,8) left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id order by a.live_at LIMIT ? OFFSET ?;';
        return database.query(sql, [assortmentIds, batchID, studentClass, subject, limit, page]);
    }

    static getTopicListFromAssortment(database, assortmentIds, limit, page, subject, studentClass) {
        let sql = '';
        if (subject === 'ALL') {
            sql = 'select *, count(*) as lecture_count from (select a.assortment_id,b.chapter,b.subject,c.duration,a.live_at, b.resource_type, b.resource_reference, case when d.faculty_name is null then b.expert_name else d.faculty_name end as faculty_name from (select * from course_resource_mapping where assortment_id in (?) and resource_type=\'resource\') as a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id inner join (select id,chapter,subject,faculty_id,case when player_type = \'youtube\' then meta_info else resource_reference end as resource_reference,resource_type,expert_name from course_resources where (resource_type in (1,8) and stream_status=\'INACTIVE\') OR (resource_type in (1,8,4) and (stream_status is null OR stream_status=\'ACTIVE\'))) as b on b.id=a.course_resource_id left join (select duration, question_id from answers where question_id!=0) as c on c.question_id=b.resource_reference left join (select name as faculty_name, id,degree_obtained as degree from etoos_faculty) as d on d.id=b.faculty_id group by b.resource_reference ) as f group by chapter order by live_at asc LIMIT ? OFFSET ?';
            return database.query(sql, [assortmentIds, studentClass, limit, page]);
        }
        sql = 'select *, count(*) as lecture_count from (select a.assortment_id,b.chapter,b.subject,c.duration, a.live_at, b.resource_type, b.resource_reference, case when d.faculty_name is null then b.expert_name else d.faculty_name end as faculty_name from (select * from course_resource_mapping where assortment_id in (?) and resource_type=\'resource\') as a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id inner join (select id,chapter,subject,faculty_id,case when player_type = \'youtube\' then meta_info else resource_reference end as resource_reference,resource_type,expert_name from course_resources where subject=? and resource_type in (1,4,8)) as b on b.id=a.course_resource_id and b.id is not null left join (select duration, question_id from answers where question_id!=0) as c on c.question_id=b.resource_reference left join (select name as faculty_name, id,degree_obtained as degree from etoos_faculty) as d on d.id=b.faculty_id group by b.resource_reference ) as f group by chapter order by live_at asc LIMIT ? OFFSET ?';
        return database.query(sql, [assortmentIds, studentClass, subject, limit, page]);
    }

    static getTopicListFromSubjectAssortment(database, assortmentId, limit, page, studentClass) {
        const sql = 'select a.assortment_id,b.chapter,b.subject, sum(c.duration) as duration,count(*) as lecture_count, a.live_at, b.resource_type, b.resource_reference, case when d.faculty_name is null then b.expert_name else d.faculty_name end as faculty_name from (select * from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id inner join (select id,chapter,subject,faculty_id,case when player_type = \'youtube\' then meta_info else resource_reference end as resource_reference,resource_type,expert_name from course_resources where resource_type in (1,4,8)) as b on b.id=a.course_resource_id and b.id is not null left join (select duration, question_id from answers where question_id!=0) as c on c.question_id=b.resource_reference left join (select name as faculty_name, id, degree from dashboard_users) as d on d.id=b.faculty_id group by b.chapter order by a.live_at asc LIMIT ? OFFSET ?';
        return database.query(sql, [assortmentId, studentClass, limit, page]);
    }

    static getNotesFromAssortmentId(database, assortmentIds, limit, page, subject, type, studentClass, batchID) {
        let sql;
        if (subject === 'ALL') {
            if (type && type != '') {
                sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and meta_info=?) as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
                return database.query(sql, [assortmentIds, batchID, studentClass, type, limit, page]);
            }
            if (type == '') {
                sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and name not like '%Notes%' and name not like 'Homework%' and name not like 'Ncert%') as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
                return database.query(sql, [assortmentIds, batchID, studentClass, limit, page]);
            }
            sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and meta_info <> 'Previous Year Papers') as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
            return database.query(sql, [assortmentIds, batchID, studentClass, limit, page]);
        }
        if (type && type != '') {
            sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and subject=? and meta_info=?) as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
            return database.query(sql, [assortmentIds, batchID, studentClass, subject, type, limit, page]);
        }
        if (type == '') {
            sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and subject=? and name not like '%Notes%' and name not like 'Homework%' and name not like 'Ncert%') as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
            return database.query(sql, [assortmentIds, batchID, studentClass, subject, limit, page]);
        }
        sql = "select trim(b.resource_reference) as resource_reference, b.subject,b.name as topic, b.chapter, b.id, e.is_free, e.assortment_id,v.variant_id FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource' and batch_id=?) AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id left join (select * from course_resources where resource_type in (2,3) and subject=? and meta_info <> 'Previous Year Papers') as b on a.course_resource_id=b.id and b.id is not null left join (select assortment_id,id as package_id from package) as p on p.assortment_id=a.assortment_id left join (select id as variant_id,package_id from variants where is_default=1) as v on v.package_id=p.package_id where b.resource_reference like 'https%' group by trim(b.resource_reference), b.subject,b.topic, b.chapter order by b.subject, b.chapter,b.topic LIMIT ? OFFSET ?";
        return database.query(sql, [assortmentIds, batchID, studentClass, subject, limit, page]);
    }

    static getLiveSectionFromAssortment(database, assortmentIds, subject, studentClass, batchID) {
        let sql;
        if (subject === 'ALL') {
            sql = 'select *,case when d.faculty_name is null then b.expert_name else d.faculty_name end as mapped_faculty_name,case when d.image_url is NULL then b.expert_image else d.image_url end as image_bg_liveclass from (select live_at, assortment_id, course_resource_id from course_resource_mapping where assortment_id in (?) and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)+1>=hour(CURRENT_TIMESTAMP))) and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id join (select * from course_resources where resource_type in (1,4,8)) as b on a.course_resource_id=b.id left join (select name as faculty_name, id,raw_image_url as image_url, degree_obtained from etoos_faculty) as d on b.faculty_id=d.id left join (select duration,question_id,is_vdo_ready from answers) as h on h.question_id=b.resource_reference order by a.live_at asc';
            return database.query(sql, [assortmentIds, batchID, studentClass]);
        }
        sql = 'select *,case when d.faculty_name is null then b.expert_name else d.faculty_name end as mapped_faculty_name,case when d.image_url is NULL then b.expert_image else d.image_url end as image_bg_liveclass from (select live_at, assortment_id, course_resource_id from course_resource_mapping where assortment_id in (?) and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)+1>=hour(CURRENT_TIMESTAMP))) and resource_type=\'resource\' and batch_id=?) as a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id join (select * from course_resources where resource_type in (1,4,8) and subject=?) as b on a.course_resource_id=b.id left join (select name as faculty_name, id,raw_image_url as image_url, degree_obtained from etoos_faculty) as d on b.faculty_id=d.id left join (select duration,question_id,is_vdo_ready from answers) as h on h.question_id=b.resource_reference order by a.live_at asc';
        return database.query(sql, [assortmentIds, batchID, studentClass, subject]);
        // console.log(sql);
    }

    static getAllFutureAssortments(database, start, end) {
        const sql = 'select live_at, assortment_id, course_resource_id from course_resource_mapping where resource_type=\'resource\' and (live_at >=CURRENT_TIMESTAMP OR (live_at BETWEEN ? AND ?))';
        return database.query(sql, [start, end]);
    }

    static getLiveSectionFromAssortmentHome(database, assortmentIds, _studentClass, subject, batchID) {
        let sql = '';
        if (subject && subject !== 'ALL') {
            sql = 'select *,case when d.faculty_name is null then b.expert_name else d.faculty_name end as mapped_faculty_name,case when d.image_url is NULL then b.expert_image else d.image_url end as image_bg_liveclass, b.stream_status as is_active from (select live_at, assortment_id, course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'resource\' and live_at <=CURRENT_TIMESTAMP and batch_id=?) as a inner join (select assortment_id,is_free from course_details) as e on a.assortment_id=e.assortment_id join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type from course_resources where resource_type in (1,4,8) and subject=?) as b on a.course_resource_id=b.id left join (select name as faculty_name, id,raw_image_url as image_url, degree_obtained from etoos_faculty) as d on b.faculty_id=d.id left join (select duration,question_id,is_vdo_ready from answers) as h on h.question_id=b.resource_reference group by b.id order by a.live_at desc limit 16';
            return database.query(sql, [assortmentIds, batchID, subject]);
        }
        sql = 'select *,case when d.faculty_name is null then b.expert_name else d.faculty_name end as mapped_faculty_name,case when d.image_url is NULL then b.expert_image else d.image_url end as image_bg_liveclass, b.stream_status as is_active from (select live_at, assortment_id, course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'resource\' and live_at <=CURRENT_TIMESTAMP and batch_id=?) as a inner join (select assortment_id,is_free from course_details) as e on a.assortment_id=e.assortment_id join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type from course_resources where resource_type in (1,4,8)) as b on a.course_resource_id=b.id left join (select name as faculty_name, id,raw_image_url as image_url, degree_obtained from etoos_faculty) as d on b.faculty_id=d.id left join (select duration,question_id,is_vdo_ready from answers) as h on h.question_id=b.resource_reference group by b.id order by a.live_at desc limit 16';
        console.log(sql);
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getSubjectsList(database, assortmentIds) {
        const sql = 'select distinct(b.subject) from (select * from course_resource_mapping where assortment_Id in (?) and resource_type=\'resource\') as a inner join course_resources as b on a.course_resource_id=b.id';
        console.log(sql);
        return database.query(sql, [assortmentIds]);
    }

    static getRelatedViewResources(database, str) {
        const sql = 'select * from course_resources where (?) and resource_type in (1,8)';
        console.log(sql);
        return database.query(sql, [str]);
    }

    static getTrendingVideos(database, studentClass) {
        const sql = 'select c.class, c.resource_reference ,a.live_at,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,c.subject,c.stream_status as is_active,c.topic,case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, d.id as faculty_id, c.chapter, c.player_type, c.resource_type, e.duration, f.is_free from (select * from liveclass_trending_lectures where class=? group by question_id order by video_time desc) as h inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type from course_resources) as c on h.question_id=c.resource_reference and h.resource_type=c.resource_type inner join (select * from course_resource_mapping) as a on a.course_resource_id=c.id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on c.faculty_id=d.id left join (select duration,question_id,is_vdo_ready from answers) as e on e.question_id=c.resource_reference join course_details as f on f.assortment_id=a.assortment_id order by a.live_at asc limit 15';
        // console.log(sql);
        return database.query(sql, [studentClass]);
    }

    static getBannersFromId(database, bannersIds) {
        const sql = 'select * from app_banners where id in (?) and page_type=\'COURSE\' and start_date < now() and end_date > now() and is_active=1 order by banner_order';
        // console.log(sql);
        return database.query(sql, [bannersIds]);
    }

    static getVideoBannersFromId(database, bannersIds) {
        const sql = 'select * from video_homepage_ad where id in (?) and page=\'EXPLORE_PAGE\' order by video_order';
        return database.query(sql, [bannersIds]);
    }

    static getAssortmentsByQuestionId(database, resourceId) {
        const sql = 'select * from (select id from course_resources where resource_reference=?) as a join (select assortment_id, course_resource_id, resource_type,live_at from course_resource_mapping) as b on a.id=b.course_resource_id and b.resource_type=\'RESOURCE\'';
        // console.log(sql);
        return database.query(sql, resourceId);
    }

    static getAssortmentsByResourceID(database, assortmentList) {
        const sql = 'select * from course_resource_mapping where course_resource_id in (?) and resource_type=\'ASSORTMENT\'';
        // console.log(sql);
        return database.query(sql, [assortmentList]);
    }

    static getParentAssortmentByResourceList(database, resourceList) {
        const sql = 'select b.*, a.resource_reference, a.class from (select id, resource_reference, class from course_resources where id in (?)) as a inner join (select * from course_resource_mapping) as b on a.id=b.course_resource_id and b.resource_type=\'RESOURCE\'';
        console.log(sql);
        return database.query(sql, [resourceList]);
    }

    static getAssortmentsByResourceReference(database, resourceReference, studentClass) {
        let sql;
        if (studentClass) {
            sql = "select distinct(b.assortment_id), d.assortment_id as chapter_assortment, crm3.assortment_id as subject_assortment, c.is_free, c.parent, a.id from (select id from course_resources where resource_reference=? and resource_type in (1,4,8)) as a inner join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id left join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='assortment') as d on b.assortment_id=d.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type='assortment') as crm3 on crm3.course_resource_id = d.assortment_id left join (select * from course_details where class = ?) as c on c.assortment_id=b.assortment_id";
            // console.log(sql);
            return database.query(sql, [resourceReference.toString(), studentClass]);
        }
        sql = "select distinct(b.assortment_id), d.assortment_id as chapter_assortment, crm3.assortment_id as subject_assortment,c.is_free,c.parent, cd.is_free as is_chapter_free, a.*,cd.class, ans.duration, b.live_at from (select id, subject, expert_image, expert_name, display,chapter, faculty_id, resource_reference, stream_status from course_resources where resource_reference=? and resource_type in (1,4,8)) as a left join answers as ans on ans.question_id = a.resource_reference inner join (select assortment_id, course_resource_id, resource_type, live_at  from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id left join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='assortment') as d on b.assortment_id=d.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type='assortment') as crm3 on crm3.course_resource_id = d.assortment_id left join (select * from course_details) as c on c.assortment_id=b.assortment_id left join (select assortment_id,is_free,class from course_details) as cd on cd.assortment_id=d.assortment_id";
        return database.query(sql, [resourceReference.toString()]);
    }

    static getAssortmentsByResourceReferenceV1(database, resourceReference) {
        const sql = "select distinct(b.assortment_id), d.assortment_id as chapter_assortment, crm3.assortment_id as subject_assortment,c.is_free,c.parent, cd.is_free as is_chapter_free, a.*,cd.class, ans.duration, b.live_at from (select id, subject, expert_image, expert_name, display,chapter, faculty_id, resource_reference, stream_status, meta_info from course_resources where resource_reference=? and resource_type in (1,4,8)) as a left join answers as ans on ans.question_id = a.resource_reference inner join (select assortment_id, course_resource_id, resource_type, live_at  from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id left join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type='assortment') as d on b.assortment_id=d.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type='assortment') as crm3 on crm3.course_resource_id = d.assortment_id left join (select * from course_details) as c on c.assortment_id=b.assortment_id left join (select assortment_id,is_free,class from course_details) as cd on cd.assortment_id=d.assortment_id";
        return database.query(sql, [resourceReference.toString()]);
    }

    static checkVipByAssortment(database, assortmentIds, studentID) {
        const sql = 'select * from (select id, assortment_id from package where assortment_id in (?)) as c inner join (select * from student_package_subscription where student_id = ? and is_active=1 and start_date<=CURRENT_DATE and end_date>=CURRENT_DATE) as d on d.new_package_id=c.id;';
        console.log(sql);
        return database.query(sql, [assortmentIds, studentID]);
    }

    static getLivestreamDetails(database, resourceReference) {
        const sql = 'select *, a.id as detail_id, a.resource_type as resource_type from (select * from course_resources where resource_reference=? and resource_type in (1,4,8)) as a left join (select * from course_resource_mapping where resource_type=\'RESOURCE\') as b on a.id=b.course_resource_id order by batch_id desc';
        console.log(sql);
        return database.query(sql, [resourceReference.toString()]);
    }

    static getRecentQuizReference(database, questionID) {
        const sql = 'select * from (select * from course_resources where resource_reference=? and resource_type=4) as a inner join (select * from liveclass_quiz_logs) as b on a.id=b.resource_id';
        console.log(sql);
        return database.query(sql, [questionID]);
    }

    static addResourceMapping(mysql, data) {
        const query = 'INSERT INTO course_resource_mapping (assortment_id, course_resource_id, resource_type, name, schedule_type, live_at, is_trial, is_replay, old_resource_id, resource_name, batch_id) VALUES ?';
        return mysql.query(query, [data]);
    }

    static getPostQuizDetails(database, resourceReference) {
        const sql = 'select a.*,b.id as liveclass_resource_id, b.old_detail_id, b.stream_start_time as stream_start_time, c.resource_reference, c.meta_info, a.created_at as publish_time from liveclass_quiz_logs as a left join course_resources as b on a.resource_id=b.resource_reference left join course_resources as c on a.quiz_resource_id=c.id where a.resource_id = ? and b.resource_type in (1,4) and c.resource_type=7 order by b.resource_type desc';
        console.log(sql);
        return database.query(sql, [parseInt(resourceReference)]);
    }

    static getPostPollDetails(database, resourceID) {
        const sql = 'select a.*, b.id as liveclass_resource_id, b.old_detail_id, b.stream_start_time as stream_start_time, c.title, c.options, c.show_result, a.created_at as publish_time, a.type from (select * from liveclass_publish where detail_id= ? and type in (\'POLL\', \'BROADCAST\')) as a left join (select * from course_resources where resource_type in (1,4,8)) as b on a.detail_id=b.id left join (select * from liveclass_polls) as c on a.info=c.id';
        console.log(sql);
        return database.query(sql, [resourceID]);
    }

    static getLiveclassResourceByResourceReference(database, resourceReference) {
        const sql = 'select * from course_resources where resource_reference=? and resource_type in (1,4) order by resource_type desc limit 1';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getRecordedResourceDetails(database, resourceReference) {
        resourceReference = resourceReference.toString();
        const sql = 'select id from course_resources where resource_reference=? limit 1';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getChapterAssortment(database, assortmentId) {
        const sql = "select * from course_resource_mapping where course_resource_id=? and resource_type='assortment'";
        console.log(sql);
        return database.query(sql, [assortmentId]);
    }

    static getChapterAssortmentDetails(database, assortmentId) {
        const sql = 'select * from (select * from course_resource_mapping where course_resource_id=? and resource_type=\'assortment\') as a inner join (select display_name,assortment_id from course_details where assortment_type=\'chapter\') as b on a.assortment_id=b.assortment_id';
        console.log(sql);
        return database.query(sql, [assortmentId]);
    }

    static getChildAssortmentsFromParent(database, assortmentId) {
        const sql = 'SELECT d.assortment_id from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id left JOIN (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as c on b.course_resource_id=c.assortment_id and b.resource_type =\'assortment\' left JOIN (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as d on c.course_resource_id=d.assortment_id and c.resource_type =\'assortment\'';
        console.log(sql);
        return database.query(sql, [assortmentId]);
    }

    static getResourcesCountFromCourseAssortment(database, assortmentId, batchID) {
        const sql = 'SELECT d.assortment_type,count(distinct d.assortment_id) as count from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_details as d on c.course_resource_id = d.assortment_id left join course_resource_mapping e on c.course_resource_id=e.assortment_id and e.resource_type = \'resource\' where d.assortment_type is NOT NULL and e.batch_id=? group by d.assortment_type';
        console.log(sql);
        return database.query(sql, [assortmentId, batchID]);
    }

    static getResourcesCountFromChapterAssortment(database, assortmentId, batchID) {
        const sql = 'SELECT count(distinct d.assortment_id) as count, d.assortment_type from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join course_details as d on a.course_resource_id=d.assortment_id left join course_resource_mapping e on a.course_resource_id=e.assortment_id and e.resource_type = \'resource\' where d.assortment_type is NOT NULL and e.batch_id=? group by d.assortment_type';
        console.log(sql);
        return database.query(sql, [assortmentId, batchID]);
    }

    static getResourcesCountFromSubjectAssortment(database, assortmentId, batchID) {
        const sql = 'SELECT count(distinct d.assortment_id) as count, d.assortment_type from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id in (?) and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type, name FROM course_resource_mapping where resource_type = \'assortment\') as b on a.course_resource_id=b.assortment_id left join course_details as d on b.course_resource_id=d.assortment_id left join course_resource_mapping e on b.course_resource_id=e.assortment_id and e.resource_type = \'resource\' where d.assortment_type is NOT NULL and e.batch_id=? group by d.assortment_type';
        console.log(sql);
        return database.query(sql, [assortmentId, batchID]);
    }

    static getChildAssortmentsFromSubjectAssortment(database, assortmentId) {
        const sql = 'SELECT c.assortment_id from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id in (?) and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id left JOIN (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping order by id) as c on b.course_resource_id=c.assortment_id and b.resource_type =\'assortment\'';
        console.log(sql);
        return database.query(sql, [assortmentId]);
    }

    static getAllCourseID(database, resourceReference) {
        const sql = 'select distinct(a.liveclass_course_id) from (select * from liveclass_course_resources where resource_reference=? and resource_type = 4) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id where b.live_at >= CURDATE() and b.live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY)';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getQuizResourceByLiveclassResourceID(database, liveclassResourceID) {
        const sql = 'SELECT a.id as liveclass_resource_id, b.assortment_id, b.live_at,f.id as quiz_resource_id,f.resource_reference, f.meta_info, f.topic from (SELECT id  FROM course_resources WHERE id = ? and resource_type = 4) as a left join course_resource_mapping as b on a.id = b.course_resource_id and b.resource_type=\'resource\' left join course_resource_mapping as c on b.assortment_id = c.assortment_id and c.resource_type = \'resource\' left join course_resources as f on c.course_resource_id=f.id where f.resource_type = 7';
        return database.query(sql, [liveclassResourceID]);
    }

    static getAllDetailID(database, resourceReference) {
        const sql = 'select distinct(a.liveclass_course_detail_id) from (select * from liveclass_course_resources where resource_reference=? and resource_type = 4) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id where b.live_at >= CURDATE() and b.live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY)';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getAllStreamResourceByResourceReference(database, resourceReference) {
        const sql = 'select * from (select * from liveclass_course_resources where resource_reference= ?  and resource_type in (4,8)) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id where b.live_at >= CURDATE() and b.live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY)';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getSubjectAssortmentByCategory(database, category, studentClass, subject) {
        const sql = "select * from course_details where category=? and class=? and assortment_type='subject' and display_name=? and is_active=1";
        console.log(sql);
        return database.query(sql, [category, studentClass, subject]);
    }

    static getRecordedResource(database, resourceReference) {
        resourceReference = resourceReference.toString();
        const sql = 'select * from course_resources where resource_type=8 and resource_reference = ?';
        return database.query(sql, [resourceReference]);
    }

    static getDefaultDataForCategory(database, category, studentClass, locale) {
        let sql;
        if (category) {
            sql = 'select * from course_categories where is_default=1 and category=? and class=? and locale=?';
            return database.query(sql, [category, studentClass, locale]);
        }
        sql = 'select * from course_categories where is_default=1 and category is null and class=? and locale=?';
        return database.query(sql, [studentClass, locale]);
    }

    static getFilterDataForCategory(database, filterIds) {
        const sql = 'select * from course_categories where id in (?)';
        return database.query(sql, [filterIds]);
    }

    static getResourceAssortmentDetails(database, assortmentId, studentClass) {
        const sql = "select * from (select * from course_details where assortment_id=? and class= ?) as a inner join (select assortment_id, course_resource_id from course_resource_mapping where resource_type='resource') as b on b.assortment_id=a.assortment_id inner join (select * from course_resources where class=?) as c on c.id=b.course_resource_id";
        return database.query(sql, [assortmentId, studentClass, studentClass]);
    }

    static getCategoryMasterFilters(database, studentClass, category) {
        const sql = 'select distinct(master_filter) from course_categories where (category=? or category is null) and class=? and is_active=1';
        return database.query(sql, [category, studentClass]);
    }

    static getCategoryChildFilters(database, studentClass, category, locale) {
        let sql;
        if (category) {
            sql = 'select * from course_categories where category=? and class=? and is_active=1 and locale=?';
            return database.query(sql, [category, studentClass, locale]);
        }
        sql = 'select * from course_categories where category is null and class=? and is_active=1 and locale=?';
        return database.query(sql, [studentClass, locale]);
    }

    static getChaptersFromCategoryType(database, category, studentCategory, subject, free, studentClass, offset) {
        let sql;
        if (category === 'others') {
            if (subject && !free) {
                sql = 'select * from course_details where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and display_name=? and class=? and is_active=1 and assortment_type=\'subject\' and parent<>4) and resource_type=\'assortment\') order by is_free, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, subject, studentClass, offset]);
            }
            if (subject && free) {
                sql = 'select * from course_details where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and display_name=? and class=? and is_active=1 and assortment_type=\'subject\' and parent<>4) and resource_type=\'assortment\') order by is_free desc, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, subject, studentClass, offset]);
            }
            if (free) {
                sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'chapter\' and parent<>4 order by is_free desc, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, studentClass, offset]);
            }
            sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'chapter\' and parent<>4 order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [studentCategory, studentClass, offset]);
        }
        if (subject && !free) {
            sql = 'select * from course_details where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and display_name=? and class=? and is_active=1 and assortment_type=\'subject\' and parent<>4) and resource_type=\'assortment\') order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, subject, studentClass, offset]);
        }
        if (subject && free) {
            sql = 'select * from course_details where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and display_name=? and class=? and is_active=1 and assortment_type=\'subject\') and resource_type=\'assortment\') order by is_free desc, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, subject, studentClass, offset]);
        }
        if (free) {
            sql = 'select * from course_details where category=? and class=? and is_active=1 and assortment_type=\'chapter\' order by is_free desc, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, studentClass, offset]);
        }
        sql = 'select * from course_details where category=? and class=? and is_active=1 and assortment_type=\'chapter\' order by is_free, dn_spotlight limit 20 offset ?';
        return database.query(sql, [category, studentClass, offset]);
    }

    static getSubjectFromCategoryType(database, category, studentCategory, subject, free, studentClass, offset) {
        let sql;
        if (category === 'others') {
            if (subject && !free) {
                sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'subject\' and display_name=? and (parent<>4 or parent is null) order by is_free, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, studentClass, subject, offset]);
            }
            if (subject && free) {
                sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'subject\' and display_name=? and (parent<>4 or parent is null) order by is_free desc, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, studentClass, subject, offset]);
            }
            if (free) {
                sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) order by is_free desc, dn_spotlight limit 20 offset ?';
                return database.query(sql, [studentCategory, studentClass, offset]);
            }
            sql = 'select * from course_details where category<>? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) and display_name not in (\'WEEKLY TEST\', \'ALL\', \'GUIDANCE\', \'QUIZ\') order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [studentCategory, studentClass, offset]);
        }
        if (subject && !free) {
            sql = 'select * from course_details where category=? and class=? and is_active=1 and assortment_type=\'subject\' and display_name=? and (parent<>4 or parent is null) order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, studentClass, subject, offset]);
        }
        if (subject && free) {
            sql = 'select * from course_details where category=? and class=? and is_active=1 and assortment_type=\'subject\' and display_name=? and (parent<>4 or parent is null) order by is_free desc, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, studentClass, subject, offset]);
        }
        if (free) {
            sql = 'select * from course_details where category=? and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) order by is_free desc, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category, studentClass, offset]);
        }
        sql = 'select * from course_details where category in (?) and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) and display_name not in (\'WEEKLY TEST\', \'ALL\', \'GUIDANCE\', \'QUIZ\') order by is_free, dn_spotlight limit 20 offset ?';
        return database.query(sql, [category, studentClass, offset]);
    }

    static getSubjectsForCategoryPage(database, category, studentClass, offset) {
        let sql;
        if (category.length && category[0].split('_')[1] === 'CT' && studentClass) {
            sql = 'select * from course_details where category_type = ? and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) and display_name not in (\'WEEKLY TEST\', \'ALL\', \'GUIDANCE\', \'QUIZ\') and is_free=0 order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [category[0].split('_')[0], studentClass, offset]);
        }
        if (category === 'others') {
            sql = 'select * from course_details where category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) and display_name not in (\'WEEKLY TEST\', \'ALL\', \'GUIDANCE\', \'QUIZ\') and is_free=0 order by is_free, dn_spotlight limit 20 offset ?';
            return database.query(sql, [studentClass, offset]);
        }
        sql = 'select * from course_details where category in (?) and class=? and is_active=1 and assortment_type=\'subject\' and (parent<>4 or parent is null) and display_name not in (\'WEEKLY TEST\', \'ALL\', \'GUIDANCE\', \'QUIZ\') and is_free=0 order by is_free, dn_spotlight limit 20 offset ?';
        return database.query(sql, [category, studentClass, offset]);
    }

    static getSubjectFromCategoryTypeForExplore(database, category, studentClass, locale) { // 60ms
        let sql = '';
        if (locale === 'hi') {
            sql = 'select * from course_details as a inner join (select crm.course_resource_id, crm.assortment_id as course_assortment from course_resource_mapping crm inner join (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type=\'course\' and is_free=0 and meta_info=\'HINDI\' and parent=1 order by year_exam desc limit 1) as cd on cd.assortment_id=crm.assortment_id and crm.resource_type=\'assortment\') as b on b.course_resource_id=a.assortment_id where is_active=1 and assortment_type=\'subject\' and display_name not in (\'ALL\', \'WEEKLY TEST\', \'GUIDANCE\', \'QUIZ\', \'ANNOUNCEMENT\') GROUP by a.assortment_id';
            return database.query(sql, [category, studentClass]);
        }
        sql = 'select * from course_details as a inner join (select crm.course_resource_id, crm.assortment_id as course_assortment from course_resource_mapping crm inner join (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type=\'course\' and is_free=0 and meta_info=\'ENGLISH\' and parent=1 order by year_exam desc limit 1) as cd on cd.assortment_id=crm.assortment_id and crm.resource_type=\'assortment\') as b on b.course_resource_id=a.assortment_id where is_active=1 and assortment_type=\'subject\' and display_name not in (\'ALL\', \'WEEKLY TEST\', \'GUIDANCE\', \'QUIZ\', \'ANNOUNCEMENT\') GROUP by a.assortment_id';
        return database.query(sql, [category, studentClass]);
    }

    static getCoursesFromCategoryType(database, category, studentCategory, free, studentClass, offset) {
        let sql;
        if (category === 'others' && free) {
            sql = 'select * from course_details where category <> ? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'course\' and parent<>4 order by is_free desc, dn_spotlight limit 20 OFFSET ?';
            return database.query(sql, [studentCategory, studentClass, offset]);
        }
        if (category === 'others') {
            sql = 'select * from course_details where category <> ? and category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\') and class=? and is_active=1 and assortment_type=\'course\' and parent<>4 order by is_free, dn_spotlight limit 20 OFFSET ?';
            return database.query(sql, [studentCategory, studentClass, offset]);
        }
        if (free) {
            sql = 'select * from course_details where category in (?) and class=? and is_active=1 and assortment_type=\'course\' order by is_free desc, dn_spotlight limit 20 OFFSET ?';
            return database.query(sql, [category, studentClass, offset]);
        }
        sql = 'select * from course_details where category in (?) and class=? and is_active=1 and assortment_type=\'course\' order by is_free, dn_spotlight limit 20 OFFSET ?';
        return database.query(sql, [category, studentClass, offset]);
    }

    static checkNextEmiPaid(database, studentId, parent) {
        const sql = 'select * from (select * from student_package_subscription where student_id=? and is_active=1) as a inner join (select * from package where type=\'emi\' and parent=?) as b on b.id=a.new_package_id';
        return database.query(sql, [studentId, parent]);
    }

    static getChildAssortmentsByResourceType(database, category, studentClass, resourceTypes, subject, free, sort, offset) {
        let sql;
        if (subject && free) {
            sql = "select a.assortment_id from (select distinct live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=1 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id order by c.is_free desc, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
        }
        if (subject && !free) {
            if (sort) {
                sql = "select a.assortment_id from (select distinct live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price desc, c.is_free, a.live_at desc limit 50 offset ?";
                return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
            }
            sql = "select a.assortment_id from (select distinct live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price, c.is_free, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
        }
        if (!free) {
            if (sort) {
                sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='course' and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price desc, c.is_free, a.live_at desc limit 50 offset ?";
                return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
            }
            sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='course' and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price, c.is_free, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
        }
        sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category=? and class=? and is_active=1 and assortment_type='course' and is_free=1 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category=? and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id order by c.is_free desc, a.live_at desc limit 50 offset ?";
        return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
    }

    static getChildAssortmentsExcludingStudentCategory(database, category, studentClass, resourceTypes, subject, free, sort, offset) {
        let sql;
        if (subject && free) {
            sql = "select a.assortment_id from (select live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=1 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id order by c.is_free desc, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
        }
        if (subject && !free) {
            if (sort) {
                sql = "select a.assortment_id from (select live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price desc, c.is_free, a.live_at desc limit 50 offset ?";
                return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
            }
            sql = "select a.assortment_id from (select live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='subject' and display_name=? and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price, c.is_free, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, subject, category, studentClass, resourceTypes, offset]);
        }
        if (!free) {
            if (sort) {
                sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='course' and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price desc, c.is_free, a.live_at desc limit 50 offset ?";
                return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
            }
            sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='course' and is_free=0 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id inner join (select * from package where type='subscription') as p on p.assortment_id=a.assortment_id inner join (select * from variants where master_parent_variant_id is null and is_default=1) as v on v.package_id=p.id order by v.display_price, c.is_free, a.live_at desc limit 50 offset ?";
            return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
        }
        sql = "select a.assortment_id from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type='course' and is_free=1 order by dn_spotlight) and resource_type='assortment') and resource_type='assortment') and resource_type='assortment')and resource_type='resource') as a inner join (select assortment_id,is_free from course_details where category<>? and category not in ('IIT JEE', 'NEET', 'CBSE Boards') and class=? and is_active=1 and assortment_type like ?) as c on c.assortment_id=a.assortment_id order by c.is_free desc, a.live_at desc limit 50 offset ?";
        return database.query(sql, [category, studentClass, category, studentClass, resourceTypes, offset]);
    }

    static getPerviosContestWinner(db, date) {
        const sql = 'select * from contest_winners where contest_id=5 and date > DATE_SUB(?, INTERVAL 8 DAY)';
        return db.query(sql, [date]);
    }

    static getPaidAssortmentsOfUser(db, studentID) {
        const sql = 'select b.assortment_id from (select * from student_package_subscription where student_id =? and amount>-1 and is_active=1) as a inner join (select * from package where type=\'subscription\' or emi_order=1) as b on a.new_package_id = b.id order by a.id desc limit 3';
        return db.query(sql, [studentID]);
    }

    static getNotesFilter(db, arr, subject, studentClass) {
        let sql;
        if (subject !== 'ALL') {
            sql = "select distinct b.meta_info FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource') AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id inner join (select meta_info,id from course_resources where resource_type in (2,3) and subject=? and meta_info is not null and meta_info <> 'Previous Year Papers') as b on a.course_resource_id=b.id and b.id is not null";
            return db.query(sql, [arr, studentClass, subject]);
        }
        sql = "select distinct b.meta_info FROM (select * from course_resource_mapping where assortment_id in (?) and resource_type='resource') AS a inner join (select assortment_id,is_free from course_details where class=?) as e on a.assortment_id=e.assortment_id inner join (select meta_info,id from course_resources where resource_type in (2,3) and meta_info is not null and meta_info <> 'Previous Year Papers') as b on a.course_resource_id=b.id and b.id is not null";
        return db.query(sql, [arr, studentClass]);
    }

    static getAllAssortments(database, assortmentID) {
        const sql = 'select course_resource_id from course_resource_mapping, (select @pv := ? ) initialisation where find_in_set(assortment_id, @pv) and length(@pv := concat(@pv,\',\', course_resource_id)) and resource_type=\'assortment\'';
        console.log(sql);
        return database.query(sql, [assortmentID]);
    }

    static getCourseAdData(database, videoClass, videoSubject) {
        // 50 ms
        const sql = 'select * from (select * from course_ads where target_class=? and (target_video_subject=? or target_video_subject is null) and is_active=1 and (ads_endtime is null or ads_endtime > CURRENT_TIMESTAMP)) as a left join answers as b on a.ad_qId=b.question_id left join (select * from answer_video_resources where resource_type=\'BLOB\') as c on b.answer_id=c.answer_id';
        return database.query(sql, [videoClass, videoSubject]);
    }

    static getNotesByQuestionID(database, questionID) {
        questionID = questionID.toString();
        const sql = 'select f.*, e.batch_id from (select * from course_resources where resource_reference=? limit 1) as a inner join (select assortment_id, course_resource_id from course_resource_mapping where resource_type=\'resource\') as b on a.id=b.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type=\'assortment\') as c on b.assortment_id=c.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type=\'assortment\') as d on c.assortment_id=d.assortment_id left join (select assortment_id, course_resource_id, batch_id from course_resource_mapping where resource_type=\'resource\') as e on d.course_resource_id=e.assortment_id left join (select * from course_resources where resource_type=2) as f on e.course_resource_id=f.id where f.id is not null group by f.id';
        console.log(sql);
        return database.query(sql, [questionID]);
    }

    static getHomeworkByQuestionID(database, questionID) {
        questionID = questionID.toString();
        const sql = 'select a.display, a.expert_name, a.chapter, a.subject, b.question_list, c.id as homework_resource_id, c.resource_reference as pdf_url, crm.batch_id from (select * from course_resources where resource_reference = ? limit 1) as a inner join (select * from liveclass_homework) as b on a.resource_reference=b.question_id inner join (select * from course_resources where resource_type=2 and meta_info=\'Homework\') as c on a.old_detail_id=c.old_detail_id inner join (select course_resource_id, batch_id from course_resource_mapping where resource_type=\'resource\') as crm on crm.course_resource_id=c.id';
        console.log(sql);
        return database.query(sql, [questionID]);
    }

    static getHomeworkByQuestionIDNew(database, questionID) { // 0.0037 sec
        questionID = questionID.toString();
        const sql = 'select a.display, a.expert_name, a.chapter, a.subject, b.question_list, a.id as homework_resource_id, b.location as pdf_url from (select * from course_resources where resource_reference = ? limit 1) as a inner join (select * from liveclass_homework) as b on a.resource_reference=b.question_id';
        console.log(sql);
        return database.query(sql, [questionID]);
    }

    static getHomeworkByQuestionIDWithBatchCheck(database, questionID, studentID) {
        const sql = 'select c.name, c.expert_name, c.subject, b.question_list, c.id as homework_resource_id, c.resource_reference as pdf_url, b.batch_id, b.question_id from  (select * from liveclass_homework where question_id=?) as b inner join (select * from course_resources where resource_type=2 and meta_info=\'Homework\') as c on b.liveclass_detail_id=c.old_detail_id inner join (select live_at, course_resource_id from course_resource_mapping) as crm on crm.course_resource_id=c.id group by question_id, batch_id';
        return database.query(sql, [+questionID, studentID]);
    }

    static getHomeworkQuestionDetails(database, questionIdList) {
        const sql = 'select a.ocr_text, a.is_answered, is_text_answered, b.*, c.duration, d.hindi from (select * from questions where question_id in ( ? )) as a left join text_solutions as b on a.question_id=b.question_id left join (select duration, question_id from answers order by answer_id desc limit 1) as c on a.question_id=c.question_id left join (select hindi, question_id from questions_localized) as d on a.question_id=d.question_id group by a.question_id';
        console.log(sql);
        return database.query(sql, [questionIdList]);
    }

    static insertHomeworkResponse(database, data) {
        const sql = 'INSERT IGNORE INTO liveclass_homework_response ( student_id, homework_resource_id, resource_reference, quiz_question_id, option_id, is_correct ) VALUES ?';
        console.log(sql);
        return database.query(sql, [data]);
    }

    static getHomeworkResponse(database, resourceReference, studentID) {
        const sql = 'select quiz_question_id, is_correct, option_id from liveclass_homework_response where student_id = ? and resource_reference = ?';
        console.log(sql);
        return database.query(sql, [studentID, resourceReference]);
    }

    static getFullHomeworkResponse(database, studentID) {
        const sql = 'select distinct(resource_reference) from liveclass_homework_response where student_id = ? order by created_at desc';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getTrendingTopics(database, studentClass, limit) {
        const sql = 'select chapter from content_trend where date_v=date_sub(CURRENT_DATE, INTERVAL 1 day) and class=? GROUP by chapter limit ?';
        // console.log(sql);
        return database.query(sql, [studentClass, limit]);
    }

    static getChaptersByClass(database, studentClass, offset) {
        const sql = 'select * from course_details where class=? and assortment_type=\'chapter\' order by is_free, dn_spotlight LIMIT 20 OFFSET ?';
        return database.query(sql, [studentClass, offset]);
    }

    static getAssortments(database, assortmentID, size, offset) {
        const sql = 'Select t1.*, t2.resource_reference,t2.meta_info, t3.question_id, t3.question_list from (select  * from course_resource_mapping, (select @pv := ?) initialisation where   find_in_set(assortment_id, @pv) and length(@pv := concat(@pv, \',\', course_resource_id))) as t1 inner join course_resources as t2 on t1.course_resource_id = t2.id and t1.resource_type = \'resource\' inner join (select * from liveclass_homework) as t3 on t2.old_detail_id=t3.liveclass_detail_id  where lower(t2.meta_info) like \'homework\' order by t1.live_at desc limit ? offset ?';
        return database.query(sql, [assortmentID, size, offset]);
    }

    static getPreviousClassses(database, facultyID, pageNo, pageSize) {
        const sql = 'SELECT *, a.id as resource_id from (select * from course_resources where faculty_id = ? and resource_type=4 and stream_status = \'INACTIVE\') as a inner join (select * from course_resource_mapping where live_at <= CURDATE() and resource_type=\'RESOURCE\') as b on a.id=b.course_resource_id group by a.id, a.class,a.subject,a.resource_reference,a.resource_type,b.live_at,a.stream_push_url,a.old_detail_id,a.stream_status order by b.live_at desc LIMIT ? OFFSET ?';
        // console.log(sql);
        return database.query(sql, [facultyID, pageSize, pageNo * pageSize]);
    }

    static getLiveNowLecturesByClass(database, assortmentIds, studentClass) {
        const sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration,cd.category_type from (select *,case when player_type=\'youtube\' and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where stream_status=\'ACTIVE\' and resource_type in (1,4,8)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at>=CURRENT_DATE() and is_replay=0) as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info,category from course_details where class=? and assortment_type=\'resource_video\' and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as crm1 on crm1.course_resource_id=c.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment" and assortment_id in (?)) as crm2 on crm1.assortment_id=crm2.course_resource_id left join (select assortment_id,category_type from course_details) as cd on cd.assortment_id=crm2.assortment_id left join answers as e on e.question_id=a.question_id';
        return database.query(sql, [studentClass, assortmentIds]);
    }

    static getReplayLecturesByClass(database, assortmentIds, studentClass) {
        const sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration from (select *,case when player_type=\'youtube\' and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,4,8)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at>=CURRENT_DATE() and live_at<now() and is_replay=2) as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info as course_language from course_details where class=? and assortment_type=\'resource_video\' and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?))) left join answers as e on e.question_id=a.question_id';
        return database.query(sql, [studentClass, assortmentIds]);
    }

    static getUpcomingLecturesByClass(database, assortmentIds, studentClass) {
        const sql = 'select b.*,a.live_at,d.*,e.course_resource_id as chapter_assortment from (select * from course_resource_mapping where resource_type=\'resource\' and is_replay=0 and live_at > now()) as a inner join (select * from course_resources cr where resource_type in (1,4,8)) as b on a.course_resource_id=b.id inner join (select assortment_id,is_free,meta_info as assortment_locale from course_details where class=? and is_free=1 and assortment_type=\'resource_video\') as d on d.assortment_id=a.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=a.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as e on e.course_resource_id=c.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where assortment_id in (?)) as f on f.course_resource_id=e.assortment_id order by a.live_at limit 10';
        return database.query(sql, [studentClass, assortmentIds]);
    }

    static getRecentLecturesByClass(database, assortmentIds, startTime, endTime, category) {
        let sql = '';
        if (category === 'iit_neet') {
            sql = 'SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,CONCAT(category,\' \',year_exam,\' \',meta_info) as course_session FROM course_details WHERE assortment_id in (?) and parent = 1 and is_free=1) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id where crm4.live_at is not null and crm4.live_at between ? and ? and crm4.is_replay=0 and cr.resource_type in (1,8) group by cr.id order by assortment_locale, crm4.live_at desc';
            return database.query(sql, [assortmentIds, startTime, endTime]);
        }
        sql = 'SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,CONCAT(year_exam-1,\'-\',substr(year_exam,3),\' \',meta_info) as course_session FROM course_details WHERE assortment_id in (?) and parent = 1 and is_free=1 and category_type in (\'BOARDS/SCHOOL/TUITION\',\'BANKING\',\'RAILWAY\')) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id where crm4.live_at is not null and crm4.live_at between ? and ? and crm4.is_replay=0 and cr.resource_type in (1,8) group by cr.id order by assortment_locale, crm4.live_at desc';
        return database.query(sql, [assortmentIds, startTime, endTime]);
    }

    // static getThreeRecentLecturesByAssortment(database, assortmentId) {
    //     const sql = 'SELECT cr.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm2.assortment_id as subject_assortment from (select * from course_resource_mapping where assortment_id=?) as crm2 left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id left join (select question_id,duration from answers) as ans on ans.question_id=cr.resource_reference where crm4.live_at is not null and crm4.is_replay=0 and cr.resource_type in (1,8) order by crm4.live_at desc limit 3';
    //     return database.query(sql, [assortmentId]);
    // }

    static getAnswerIdbyQuestionId(database, questionId) {
        const sql = 'select * from answers where question_id=?';
        return database.query(sql, [questionId]);
    }

    static getHomeworkByAssortmentID(database, assortmentId, limit, offset, subject, filterType, studentID, batchID) {
        let sql = '';
        if (filterType === 'completed') {
            if (subject) {
                sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3) and subject=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null order by b.live_at desc limit ? offset ?';
                return database.query(sql, [subject, batchID, assortmentId, studentID, limit, offset]);
            }
            sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null order by b.live_at desc limit ? offset ?';
            return database.query(sql, [batchID, assortmentId, studentID, limit, offset]);
        }
        if (filterType === 'pending') {
            if (subject) {
                sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3) and subject=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null order by b.live_at desc limit ? offset ?';
                return database.query(sql, [subject, batchID, assortmentId, studentID, limit, offset]);
            }
            sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null order by b.live_at desc limit ? offset ?';
            return database.query(sql, [batchID, assortmentId, studentID, limit, offset]);
        }
        if (subject) {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3) and subject=?) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id order by b.live_at desc limit ? offset ?';
            return database.query(sql, [subject, batchID, assortmentId, limit, offset]);
        }
        sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id order by b.live_at desc limit ? offset ?';
        return database.query(sql, [batchID, assortmentId, limit, offset]);
    }

    static getHomeworkByAssortmentIDHomepage(database, assortmentId, batchID, limit, offset) {
        const sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id where e.created_at <= "2022-09-01" UNION select a.resource_reference,a.subject,a.meta_info,b.id, b.assortment_id, b.course_resource_id, b.resource_type, b.schedule_type, concat("Homework - ", a.topic, " - L", a.q_order) as name, b.live_at, b.created_at, b.is_trial, b.is_replay, b.old_resource_id, b.resource_name, b.batch_id, b.updated_at, e.question_id, e.question_list from (select * from course_resources where resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference where e.created_at >= "2022-09-01" and e.question_id is not null group by a.resource_reference order by live_at desc limit ? offset ?';
        return database.query(sql, [batchID, assortmentId, batchID, assortmentId, limit, offset]);
    }

    static getHomeworkByAssortmentIDNew(database, assortmentId, subject, filterType, studentID, batchID) {
        let sql = '';
        if (filterType === 'completed') {
            if (subject) {
                sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1 and subject=?) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
                return database.query(sql, [subject, batchID, assortmentId, studentID]);
            }
            sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
            return database.query(sql, [batchID, assortmentId, studentID]);
        }
        if (filterType === 'pending') {
            if (subject) {
                sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1 and subject=?) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
                return database.query(sql, [subject, batchID, assortmentId, studentID]);
            }
            sql = 'select a.resource_reference,a.chapter,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
            return database.query(sql, [batchID, assortmentId, studentID]);
        }
        if (subject) {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1 and subject=?) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference where e.question_id is not null group by a.resource_reference order by b.live_at desc';
            return database.query(sql, [subject, batchID, assortmentId]);
        }
        sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.question_id=a.resource_reference where e.question_id is not null group by a.resource_reference order by b.live_at desc';
        return database.query(sql, [batchID, assortmentId]);
    }

    static getHomeworkBySubjectAssortmentID(database, assortmentId, limit, offset, filterType, studentID, batchID) {
        let sql = '';
        if (filterType === 'completed') {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null order by b.live_at desc limit ? offset ?';
            return database.query(sql, [batchID, assortmentId, studentID, limit, offset]);
        }
        if (filterType === 'pending') {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null order by b.live_at desc limit ? offset ?';
            return database.query(sql, [batchID, assortmentId, studentID, limit, offset]);
        }
        sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id order by b.live_at desc limit ? offset ?';
        return database.query(sql, [batchID, assortmentId, limit, offset]);
    }

    static getHomeworkBySubjectAssortmentIDNew(database, assortmentId, filterType, studentID, batchID) {
        let sql = '';
        if (filterType === 'completed') {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources where resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select DISTINCT(resource_reference) as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is not null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
            return database.query(sql, [batchID, assortmentId, studentID]);
        }
        if (filterType === 'pending') {
            sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.question_id=a.resource_reference left join (select resource_reference as id from liveclass_homework_response where student_id=?) as lhr on lhr.id=e.question_id where lhr.id is null and e.question_id is not null group by a.resource_reference order by b.live_at desc';
            return database.query(sql, [batchID, assortmentId, studentID]);
        }
        sql = 'select a.resource_reference,a.subject,a.meta_info,b.*,e.question_id, e.question_list, concat("Homework - ", a.topic, " - L", a.q_order) as name from (select * from course_resources resource_type=1) as a inner join (select * from course_resource_mapping where resource_type="resource" and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join liveclass_homework as e on e.question_id=a.resource_reference group by a.resource_reference order by b.live_at desc';
        return database.query(sql, [batchID, assortmentId]);
    }

    static getHomeworkByChapterAssortmentID(database, assortmentIds, batchID) {
        const sql = 'SELECT cr.*,b.*,lhw.question_id,lhw.question_list from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id in (?) and resource_type = \'assortment\') as a left join course_resource_mapping as b on a.course_resource_id = b.assortment_id and b.resource_type=\'resource\' and b.batch_id=? left join course_resources as cr on b.course_resource_id=cr.id left join (select question_id,question_list,liveclass_detail_id from liveclass_homework) as lhw on lhw.liveclass_detail_id=cr.old_detail_id where cr.resource_type in (2,3) and upper(cr.meta_info)=\'HOMEWORK\' and lhw.question_id is not null order by b.live_at desc';
        return database.query(sql, [assortmentIds, batchID]);
    }

    static getHomeworkByChapterAssortmentIDNew(database, assortmentIds, batchID) {
        const sql = 'SELECT cr.*,b.*,lhw.question_id,lhw.question_list from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id in (?) and resource_type = \'assortment\') as a left join course_resource_mapping as b on a.course_resource_id = b.assortment_id and b.resource_type=\'resource\' and b.batch_id=? left join course_resources as cr on b.course_resource_id=cr.id left join (select question_id,question_list,liveclass_detail_id from liveclass_homework where created_at < \'2022-09-01\') as lhw on lhw.liveclass_detail_id=cr.old_detail_id where cr.resource_type in (2,3) and upper(cr.meta_info)=\'HOMEWORK\' and lhw.question_id is not null UNION select c.*,b.id, b.assortment_id, b.course_resource_id, b.resource_type, b.schedule_type, concat("Homework - ", c.topic, " - L", c.q_order) as name, b.live_at, b.created_at, b.is_trial, b.is_replay, b.old_resource_id, b.resource_name, b.batch_id, b.updated_at, d.question_id,d.question_list from (select * from course_resource_mapping where assortment_id in (?) and resource_type="assortment") as a left join course_resource_mapping as b on a.course_resource_id=b.assortment_id left join course_resources as c on b.course_resource_id=c.id  left join liveclass_homework as d on c.resource_reference=d.question_id where c.resource_type=1 and b.resource_type="resource" and b.batch_id=? and d.id is not null and d.created_at >= \'2022-09-01\' group by d.question_id order by live_at desc';
        return database.query(sql, [assortmentIds, batchID, assortmentIds, batchID]);
    }

    static getPaidCoursesExcludingUsersPurchased(database, assortmentId) {
        const sql = 'select cr.class,cr.subject,cr.expert_name,cr.expert_image,cr.display,max(live_at) as live_at, a.is_free, e.assortment_id, a.assortment_id as course_assortment,a.display_name, a.demo_video_thumbnail, a.meta_info from (select * from course_details where assortment_type=\'course\' and is_active=1 and is_free=0 and assortment_id=?) as a inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type= \'assortment\') as b on a.assortment_id = b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.assortment_id = b.course_resource_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as d on d.assortment_id = c.course_resource_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as crm on crm.assortment_id = d.course_resource_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as crm1 on crm1.assortment_id = crm.course_resource_id inner join (select course_resource_id,assortment_id,live_at from course_resource_mapping where resource_type=\'resource\') as e on e.assortment_id=crm1.course_resource_id inner join (select * from course_resources where resource_type in (1,8)) as cr on cr.id=e.course_resource_id GROUP by a.assortment_id limit 1';
        return database.query(sql, [assortmentId]);
    }

    static getCoursesForHomepage(database, studentClass, studentLocale) {
        let sql;
        if (studentLocale === 'hi') {
            sql = 'select * from course_details where assortment_type=\'course\' and class=? and is_active=1 and is_free=0 and assortment_id not in (15,16) order by meta_info desc, dn_spotlight';
            return database.query(sql, [studentClass]);
        }
        sql = 'select * from course_details where assortment_type=\'course\' and class=? and is_active=1 and is_free=0 and assortment_id not in (15,16) order by meta_info, dn_spotlight';
        return database.query(sql, [studentClass]);
    }

    static getCoursesForHomepageByCategory(database, studentClass, studentLocale) {
        let sql;
        if (studentLocale === 'hi') {
            sql = 'select a.*,cdlcm.liveclass_course_id from (select *, case when meta_info in (\'HINDI\',\'ENGLISH\') then meta_info else \'HINDI\' end as course_language from course_details cd where cd.assortment_type in (\'course\', \'course_bundle\') and cd.class=? and cd.is_active=1 and is_free=0 and parent<>4 and cd.assortment_id not in (15,16) and ccm_id=1 UNION select *,meta_info as course_language from course_details where assortment_id=138829 and class=? and is_active=1) as a left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id=a.assortment_id order by a.priority';
            return database.query(sql, [studentClass, studentClass]);
        }
        sql = 'select a.*,cdlcm.liveclass_course_id from (select *, case when meta_info in (\'HINDI\',\'ENGLISH\') then meta_info else \'ENGLISH\' end as course_language from course_details cd where cd.assortment_type in (\'course\', \'course_bundle\') and cd.class=? and cd.is_active=1 and is_free=0 and parent<>4 and cd.assortment_id not in (15,16) and ccm_id=1 UNION select *,meta_info as course_language from course_details where assortment_id=138829 and class=? and is_active=1) as a left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id=a.assortment_id order by a.priority';
        return database.query(sql, [studentClass, studentClass]);
    }

    static getCategoriesByCcmId(database, ccmArray) {
        const sql = 'select DISTINCT ecm.category as category,ccm.category as category_type from exam_category_mapping ecm left join class_course_mapping ccm on ccm.course = ecm.exam where ccm.id in (?)';// 20-30 ms
        return database.query(sql, [ccmArray]);
    }

    static getFreeAssortmentsByCcmId(database, ccmArray, locale) {
        const localeStr = locale === 'hi' ? 'HN' : 'EN';
        const sql = 'SELECT cdlcm.assortment_id from ccm_lc_course_mapping clcm join course_details_liveclass_course_mapping cdlcm on clcm.free_liveclass_course_id  = cdlcm.liveclass_course_id where clcm.ccm_id in (?) and clcm.locale =?';// 30-40 ms
        return database.query(sql, [ccmArray, localeStr]);
    }

    static getSubjeectsByAssortmentId(database, assortmentIds) {
        const sql = 'SELECT * from course_resource_mapping crm  WHERE name not in (\'GUIDANCE\',\'WEEKLY TEST\',\'ANNOUNCEMENT\',\'\') and assortment_id in (?)';// 30-40 ms
        return database.query(sql, [assortmentIds]);
    }

    static getCoursesForHomepageIcons(database, studentClass, category, studentLocale) {
        let sql;
        if (studentLocale === 'hi') {
            sql = `select
            a.*,
            cdlcm.liveclass_course_id
        from
            (
                select
                    *,
                    case
                        when meta_info in ('HINDI', 'ENGLISH') then meta_info
                        else 'HINDI'
                    end as course_language
                from
                    course_details cd
                where
                    cd.assortment_type = 'course'
                    and cd.class = ?
                    and cd.is_active = 1
                    and is_free = 0
                    and parent <> 4
                    and cd.assortment_id not in (15, 16)
                    and category in (?)
                    and meta_info in ('HINDI','HINGLISH')
                UNION
                select
                    *,
                    meta_info as course_language
                from
                    course_details
                where
                    assortment_id = 138829
                    and class = ?
                    and is_active = 1
            ) as a
            left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id = a.assortment_id
        order by
            a.sub_assortment_type,
            a.course_language desc,
            FIELD(category, 'IIT JEE', 'NEET'),
            a.created_at desc
            `;
            return database.query(sql, [studentClass, category, studentClass]);// 130-140 ms
        }
        sql = `select
        a.*,
        cdlcm.liveclass_course_id
      from
        (
          select
            *,
            case when meta_info in ('HINDI', 'ENGLISH') then meta_info else 'ENGLISH' end as course_language
          from
            course_details cd
          where
            cd.assortment_type = 'course'
            and cd.class = ?
            and cd.is_active = 1
            and is_free = 0
            and parent <> 4
            and cd.assortment_id not in (15, 16)
            and category in (?)
            and meta_info in ('ENGLISH','HINGLISH')
          UNION
          select
            *,
            meta_info as course_language
          from
            course_details
          where
            assortment_id = 138829
            and class = ?
            and is_active = 1
        ) as a
        left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id = a.assortment_id
      order by
        a.sub_assortment_type,
        a.course_language,
        FIELD(category, 'IIT JEE', 'NEET'),
        a.created_at desc`;
        return database.query(sql, [studentClass, category, studentClass]);// 130-140 ms
    }

    static getCourseDetailsFromVariantId(database, variantId) {
        const sql = 'select cd.*, v.display_price, v.package_id, p.batch_id from package p join variants v on v.package_id = p.id join course_details cd on cd.assortment_id = p.assortment_id where v.id = ?';
        console.log(sql);
        return database.query(sql, [variantId]);
    }

    static hasActiveCoursePurchase(database, studentId) {
        const sql = 'select cd.* from student_package_subscription sps join package p on sps.new_package_id = p.id join course_details cd on cd.assortment_id = p.assortment_id where cd.assortment_type = "course" and sps.is_active = 1 and sps.amount > 0 and sps.end_date >= CURDATE() and sps.student_id = ?';
        console.log(sql);
        return database.query(sql, [studentId]);
    }

    static getTimetableByAssortment(database, assortmentId) {
        const sql = 'select * from course_timetable where assortment_id=? and is_active=1 group by topic_covered ORDER by week_number';
        return database.query(sql, [assortmentId]);
    }

    static getFAQsByAssortment(database, assortmentId, locale, batchId) {
        const sql = 'select * from faq where bucket = CONCAT(\'course_details_\',?) and locale=? and is_active=1 and (batch_id is null or batch_id=?) order by priority';
        return database.query(sql, [assortmentId, locale, batchId]);
    }

    static getBannerByPageValue(database, page) {
        const sql = 'select * from app_banners where page_type=? AND is_active=1 and CURRENT_TIMESTAMP >= START_DATE AND CURRENT_TIMESTAMP <= end_date';
        return database.query(sql, [page]);
    }

    static checkWalletCreditStudent(database, studentID) {
        const sql = 'select * from wallet_credit_students_experiment where student_id=?';
        return database.query(sql, [studentID]);
    }

    static getCoursesClassCourseMapping(database, studentId) {
        const sql = 'select a.course, a.id, a.category from class_course_mapping a left join student_course_mapping b on a.id = b.ccm_id where b.student_id=?';
        return database.query(sql, [studentId]);
    }

    static getCoursesClassCourseMappingExtraMarks(database, studentId) {
        const sql = `select ccm.id, ecm.exam, ecm.category from student_course_mapping scm
        left join class_course_mapping ccm on scm.ccm_id = ccm.id
        left join exam_category_mapping ecm on ecm.exam = ccm.course
        where scm.student_id = ?`;
        return database.query(sql, [studentId]);
    }

    static getBoardCourseMapping(database, studentId) {
        const sql = 'select a.course from class_course_mapping a left join student_course_mapping b on a.id = b.ccm_id where b.student_id=? and b.category = \'board\'';
        return database.query(sql, [studentId]);
    }

    static getBoardNameFromCcmId(database, ccmId) {
        const sql = 'SELECT course,class FROM class_course_mapping WHERE id = ?';
        return database.query(sql, [ccmId]);
    }

    static getAllReferralMessagesUsingLocale(database, locale, type) {
        const sql = 'SELECT * FROM referral_messages where locale in (?) and iteration=? and is_active=1';
        return database.query(sql, [locale, type]);
    }

    static getTopicsCountOfCourse(database, assortmentId) {
        const sql = 'select count(*) as count from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)';
        return database.query(sql, [assortmentId]);
    }

    static getTeachersByAssortmentId(database, assortmentId, assortmentType) {
        let sql = null;
        if (assortmentType === 'subject') {
            sql = 'SELECT e.expert_name,e.expert_image,ef.degree, ef.experience,e.subject from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id left JOIN (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as c on b.course_resource_id=c.assortment_id and b.resource_type =\'assortment\' inner join (select id,expert_name,expert_image,subject,faculty_id from course_resources where expert_name not in (\'ALL\', \'DOUBTNUT ADMIN\') and faculty_id is not null and resource_type in (1,4,8)) as e on c.course_resource_id=e.id left join dashboard_users as ef on ef.id=e.faculty_id group by e.faculty_id';
            return database.query(sql, [assortmentId]);
        }
        if (assortmentType === 'chapter') {
            sql = 'SELECT e.expert_name,e.expert_image,ef.degree, ef.experience,e.subject from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id inner join (select id,expert_name,expert_image,subject,faculty_id from course_resources where expert_name not in (\'ALL\', \'DOUBTNUT ADMIN\') and faculty_id is not null and resource_type in (1,4,8)) as e on b.course_resource_id=e.id left join dashboard_users as ef on ef.id=e.faculty_id group by e.faculty_id';
            return database.query(sql, [assortmentId]);
        }
        sql = 'select faculty_name as expert_name, degree, image_url as expert_image, subject_name_localised as subject,rating,experience_in_hours,students_mentored,demo_qid, du.* from course_teacher_mapping ctm left join (select id, experience from dashboard_users) as du on du.id=ctm.faculty_id where ctm.assortment_id =?';
        return database.query(sql, [assortmentId]);
    }

    static getOnboardingItems(database, studentLocale, sessionCount) {
        const sql = 'select * from onboarding_data where is_active=\'1\' and source=\'paid\' and locale=? and session_count=?';
        return database.query(sql, [studentLocale, sessionCount]);
    }

    static getScheduleTypeWithAssortmentId(database, assortmentId) {
        const sql = 'select * from course_resource_mapping where assortment_id=?';
        return database.query(sql, [assortmentId]);
    }

    static addCourseAdsViewStats(database, uuid, adId, studentId) {
        const sql = 'INSERT INTO course_ads_view_stats_1 (uuid, ad_id, student_id) VALUES ( ?, ?, ?)';
        return database.query(sql, [uuid, adId, studentId]);
    }

    static addCourseAdsEngageTime(database, uuid, engageTime) {
        const sql = 'INSERT IGNORE INTO course_ads_engagetime_stats_1 (uuid, engage_time) VALUES ( ?, ?)';
        return database.query(sql, [uuid, engageTime]);
    }

    static getAdLifetimeWatch(database, adId, studentId) {
        // 110 ms
        const sql = 'select sum(1) as watch_count from course_ads_view_stats_1 as a inner join course_ads_engagetime_stats_1 as b on a.uuid=b.uuid where a.ad_id = ? and a.student_id = ? and a.is_LF = 0';
        return database.query(sql, [adId, studentId]);
    }

    static getStudentAdsWatchedToday(database, studentId) {
        // 125 ms
        const sql = 'select count(*) as watch_count from course_ads_view_stats_1 as a inner join course_ads_engagetime_stats_1 as b on a.uuid=b.uuid where a.student_id = ? and a.is_LF = 0 and b.created_at >= CURDATE() and b.created_at < CURDATE() + INTERVAL 1 DAY';
        return database.query(sql, [studentId]);
    }

    static getDailyAdsLimit(database) {
        const sql = "select key_value from app_configuration where key_name='daily_limit'";
        return database.query(sql);
    }

    static getNewUserInterval(database) {
        const sql = "select key_value from app_configuration where key_name='interval'";
        return database.query(sql);
    }

    static setPreAppliedReferralCode(database, data) {
        const sql = 'INSERT INTO students_pre_applied_coupons set ?';
        return database.query(sql, [data]);
    }

    static getPreAppliedCoupon(database, studentID) {
        const sql = 'select * from students_pre_applied_coupons where student_id=? and is_active = 1 order by id DESC LIMIT 1';
        return database.query(sql, [studentID]);
    }

    static getCampainEligibilityOfStudent(database, studentID, coupon) {
        const sql = 'select * from students_pre_applied_coupons where student_id=? and coupon_code=? order by id DESC LIMIT 1';
        return database.query(sql, [studentID, coupon]);
    }

    static getVendorByAssortmentId(database, assortmentId) {
        const sql = 'select vendor_id from course_details_liveclass_course_mapping where assortment_id=?';
        return database.query(sql, [assortmentId]);
    }

    static checkReferralEligibility(database, studentID) {
        // const sql = `select * from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a left join (select * from payment_info where status='SUCCESS' AND student_id=?) as b on a.coupon_code=b.coupon_code`;
        const sql = 'select a.*,b.id as payment_info_id from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a left join (select * from payment_info where status=\'SUCCESS\' AND student_id=?) as b on a.coupon_code=b.coupon_code';
        return database.query(sql, [studentID, studentID]);
    }

    static getClassByAssortmentId(database, assortmentId) {
        const sql = 'select distinct (class) as all_class from course_details where assortment_id=?';
        return database.query(sql, [assortmentId]);
    }

    static getChildFiltersFromCourseDetails(database, column) {
        const sql = `select distinct (${column}) as id, ? as master_filter from course_details order by id`;
        return database.query(sql, [column]);
    }

    static getCoursesList(database, category, studentClass) { // 20-25ms
        let sql;
        if (category.length && category[0] !== null && category[0].split('_')[1] === 'CT' && studentClass) {
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where category_type=? and class=? and is_active=1 and assortment_type=\'course\' and parent<>4) as cd  left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by is_free, created_at desc';
            return database.query(sql, [category[0].split('_')[0], studentClass]);
        }
        if (category === 'others' && studentClass) {
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where category not in (\'IIT JEE\', \'NEET\', \'CBSE Boards\', \'NDA\') and class=? and is_active=1 and assortment_type=\'course\' and parent<>4) as cd  left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by is_free, created_at desc';
            return database.query(sql, [studentClass]);
        }
        if (category && studentClass) {
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where is_active=1 and assortment_type=\'course\' and class= ? and category in (?) and parent<>4 UNION select * from course_details where assortment_id=138829 and class=? and is_active=1) as cd left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by is_free, created_at desc';
            return database.query(sql, [studentClass, category, studentClass]);
        }
        if (category) {
            sql = 'select * from course_details where is_active=1 and assortment_type=\'course\' and category in (?) and parent<>4 order by is_free, created_at desc';
            return database.query(sql, [category]);
        }
        if (studentClass) {
            sql = 'select * from course_details where is_active=1 and assortment_type=\'course\' and class= ? and parent<>4 order by is_free, created_at desc';
            return database.query(sql, [studentClass]);
        }
        sql = 'select * from course_details where is_active=1 and assortment_type=\'course\' and parent<>4 order by is_free, created_at desc';
        return database.query(sql);
    }

    static checkReferralStudentEligibility(database, studentID) {
        // const sql = `select * from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a left join (select * from payment_info where status='SUCCESS' AND student_id=?) as b on a.coupon_code=b.coupon_code`;
        // const sql = 'select a.*,b.id as payment_info_id from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a left join (select * from payment_info where status=\'SUCCESS\' AND student_id=?) as b on a.coupon_code=b.coupon_code';
        const sql = 'select a.*,b.id as payment_info_id from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a  left join student_referral_course_coupons  as c on a.coupon_code=c.coupon_code  left join (select * from payment_info where status=\'SUCCESS\' AND student_id=?) as b on a.coupon_code=b.coupon_code where c.student_id is not null';
        return database.query(sql, [studentID, studentID]);
    }

    static getLatestPreAppliedCoupon(database, studentID) {
        const sql = 'select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1';
        return database.query(sql, [studentID]);
    }

    static getAdsPlayArray(database) {
        const sql = "select key_value from app_configuration where key_name='ads_play_array'";
        return database.query(sql);
    }

    static getvideoViewExperiment(database) {
        const sql = "select key_value from app_configuration where key_name='video_experiment'";
        return database.query(sql);
    }

    static getcourseDetailForPaymentPending(database, assortmentId, studentClass) {
        const sql = 'select * from course_details where assortment_id=? and class=?';
        return database.query(sql, [assortmentId, studentClass]);
    }

    static addReferralPageViews(database, data) {
        const sql = 'insert into referral_iteration_views set ?';
        return database.query(sql, [data]);
    }

    static getAssortmentDetailsWithOnlyId(db, assortmentId, studentID) {
        const sql = 'select * from (select * from course_details where assortment_id in (?)) as cd inner join (select id, assortment_id from package) as p on p.assortment_id=cd.assortment_id inner join (select new_package_id, start_date as subscription_start_date, end_date as subscription_end_date from student_package_subscription where student_id=? and is_active=1) as sps on sps.new_package_id=p.id group by cd.assortment_id';
        // console.log(sql);
        return db.query(sql, [assortmentId, studentID]);
    }

    static getPostPurchaseCourseCards(db, locale, subjectPage, assortmentType, subType, pageType, versionCode) {
        let sql = '';
        if (assortmentType && assortmentType.includes('resource')) {
            sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and assortment_level=\'resource\' and (sub_level is null or sub_level=\'all\') and min_version_code <=? and max_version_code >=? order by card_order';
            return db.query(sql, [locale, pageType, versionCode, versionCode]);
        }
        if (assortmentType === 'chapter') {
            sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and assortment_level in (\'chapter\',\'resource\') and (sub_level is null or sub_level=\'all\') and min_version_code <=? and max_version_code >=? order by card_order';
            return db.query(sql, [locale, pageType, versionCode, versionCode]);
        }
        if (assortmentType === 'subject') {
            sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and assortment_level in (\'subject\',\'chapter\',\'resource\') and (sub_level is null or sub_level=\'all\') and min_version_code <=? and max_version_code >=? order by card_order';
            return db.query(sql, [locale, pageType, versionCode, versionCode]);
        }
        if (subjectPage === 1) {
            sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and subject_page=1 and (sub_level is null or sub_level=\'all\') and min_version_code <=? and max_version_code >=?';
            return db.query(sql, [locale, pageType, versionCode, versionCode]);
        }
        if (subType) {
            sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and (sub_level=? or sub_level is null) and min_version_code <=? and max_version_code >=? order by card_order';
            return db.query(sql, [locale, pageType, subType, versionCode, versionCode]);
        }
        sql = 'select * from course_detail_page_cards where locale=? and page_type=? and is_active=1 and (sub_level is null or sub_level=\'all\') and min_version_code <=? and max_version_code >=? order by card_order';
        return db.query(sql, [locale, pageType, versionCode, versionCode]);
    }

    static getPostPurchaseCourseCardsById(db, cardID, locale) {
        const sql = 'select * from course_detail_page_cards where card_id=? and locale=?';
        return db.query(sql, [cardID, locale]);
    }

    static getPrePurchaseCourseHighlights(db, assortmentId, locale, limit = 20) {
        const sql = `select CONCAT(title," ",subtitle) as title, image_url from course_pre_purchase_highlights where is_active=1 and locale = ? and ${assortmentId ? 'assortment_id = ?' : 'assortment_id is null'} order by priority limit ?`;
        return assortmentId ? db.query(sql, [locale, assortmentId, limit]) : db.query(sql, [locale, limit]);
    }

    static getBannerDetailsFromAdId(database, adId) {
        const sql = 'select banner_id from course_ads where ad_id = ?';
        return database.query(sql, [adId]);
    }

    static addScholarshipTest(database, studentId, testId, progressId, defaultCoupon, discountPercent) {
        const sql = 'INSERT INTO scholarship_test (student_id, test_id, progress_id, is_active, coupon_code, discount_percent) VALUES (?, ?, ?, 1, ?, ?)';
        return database.query(sql, [studentId, testId, progressId, defaultCoupon, discountPercent]);
    }

    static getScholarshipTest(database, studentId) {
        const sql = 'select * from scholarship_test where student_id=? and is_active = 1';
        return database.query(sql, [studentId]);
    }

    static updateScholarshipTest(database, studentId, testId, oldTestId, progressId, defaultCoupon, discountPercent) {
        const sql = 'update scholarship_test set test_id = ?, progress_id = ?, coupon_code = ?, discount_percent = ? where student_id = ? and test_id = ?';
        return database.query(sql, [testId, progressId, defaultCoupon, discountPercent, studentId, oldTestId]);
    }

    static getStudentCCMExamCategoriesForClass14(database, studentId) {
        const sql = 'select * from student_course_mapping a inner join class_course_mapping b on a.ccm_id = b.id and b.class = 14 inner join exam_category_mapping c on b.course = c.exam and c.is_active = 1 where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getSubjectsListByCourseAssortment(db, assortmentID) {
        let sql = '';
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select *, display_name as title from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) ) as a inner join (select * from course_details where display_name<>\'ALL\' and display_name<>\'QUIZ\' and display_name <> \'INTRODUCTION\') as b on b.assortment_id=a.course_resource_id group by b.assortment_id';
            return db.query(sql, [assortmentID]);
        }
        sql = 'select *, display_name as title from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' ) as a inner join (select * from course_details where display_name not in (\'WEEKLY TEST\',\'ALL\',\'QUIZ\', \'ANNOUNCEMENT\',\'INTRODUCTION\')) as b on b.assortment_id=a.course_resource_id group by b.assortment_id';
        return db.query(sql, [assortmentID]);
    }

    static getSubjectsListWithTeachersByCourseAssortment(db, assortmentID) { // 90ms
        const sql = 'select b.*, ctm.image_url as faculty_image_url from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' ) as a inner join (select * from course_details where display_name not in (\'WEEKLY TEST\',\'ALL\',\'QUIZ\', \'ANNOUNCEMENT\',\'INTRODUCTION\',\'GUIDANCE\')) as b on b.assortment_id=a.course_resource_id left join (select assortment_id,image_url, subject from course_teacher_mapping where assortment_id=?) as ctm on ctm.subject=b.display_name group by b.assortment_id';
        return db.query(sql, [assortmentID, assortmentID]);
    }

    static getSubjectFiltersForBooks(db, assortmentID, bookType) { // 20ms
        const sql = 'select subject as display_name from assortment_studentid_package_mapping where assortment_id=? and book_type=? group by subject';
        return db.query(sql, [assortmentID, bookType]);
    }

    static getChapterListOfAssortment(db, subject, assortmentID, assortmentType, limit, offset, tab = '') {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' limit ? OFFSET ?';
            return db.query(sql, [assortmentID, limit, offset]);
        }
        if (subject) {
            if (+assortmentID === 15 || +assortmentID === 16) {
                sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter_order,chapter from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc limit ? OFFSET ?';
                return db.query(sql, [assortmentID, subject, assortmentID, limit, offset]);
            }
            sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment' and name=?) and resource_type='assortment') as a inner join (select assortment_id, display_name from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter_order,chapter from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order ${tab === 'homework' ? '' : 'desc'} limit ? OFFSET ?`;
            return db.query(sql, [assortmentID, subject, assortmentID, limit, offset]);
        }
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc limit ? OFFSET ?';
            return db.query(sql, [assortmentID, assortmentID, limit, offset]);
        }
        sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment') and resource_type='assortment') as a inner join (select assortment_id, display_name,category from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by (case when cd.category like 'ETOOS%' then -1*a.course_resource_id else -mcm.chapter_order end) ${tab === 'homework' ? '' : 'desc'} limit ? OFFSET ?`;
        return db.query(sql, [assortmentID, assortmentID, limit, offset]);
    }

    static getChapterListOfAssortmentAll(db, subject, assortmentID, assortmentType, tab = '') {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\'';
            return db.query(sql, [assortmentID]);
        }
        if (subject) {
            if (+assortmentID === 15 || +assortmentID === 16) {
                sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter_order,chapter from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc';
                return db.query(sql, [assortmentID, subject, assortmentID]);
            }
            sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment' and name=?) and resource_type='assortment') as a inner join (select assortment_id, display_name from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter_order,chapter from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order ${tab === 'homework' ? '' : 'desc'}`;
            return db.query(sql, [assortmentID, subject, assortmentID]);
        }
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc';
            return db.query(sql, [assortmentID, assortmentID]);
        }
        sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment') and resource_type='assortment') as a inner join (select assortment_id, display_name,category from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by (case when cd.category like 'ETOOS%' then -1*a.course_resource_id else -mcm.chapter_order end) ${tab === 'homework' ? '' : 'desc'}`;
        return db.query(sql, [assortmentID, assortmentID]);
    }

    static getChapterListOfAssortmentWithoutChapterOrder(db, subject, assortmentID, assortmentType, limit, offset) {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' limit ? OFFSET ?';
            return db.query(sql, [assortmentID, limit, offset]);
        }
        if (subject) {
            if (+assortmentID === 15 || +assortmentID === 16) {
                sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter_order,chapter from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc limit ? OFFSET ?';
                return db.query(sql, [assortmentID, subject, assortmentID, limit, offset]);
            }
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id group by cd.assortment_id limit ? OFFSET ?';
            return db.query(sql, [assortmentID, subject, limit, offset]);
        }
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc limit ? OFFSET ?';
            return db.query(sql, [assortmentID, assortmentID, limit, offset]);
        }
        sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name,category from course_details where is_active=1) as cd on cd.assortment_id=a.course_resource_id group by cd.assortment_id limit ? OFFSET ?';
        return db.query(sql, [assortmentID, limit, offset]);
    }

    // eslint-disable-next-line no-unused-vars
    static getChapterListOfAssortmentVod(db, subject, assortmentID, assortmentType, limit, offset, tab = '', isMultiple) {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' limit ? OFFSET ?';
            return db.query(sql, [assortmentID, limit, offset]);
        }
        if (subject) {
            if (+assortmentID === 15 || +assortmentID === 16) {
                sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join  (select assortment_id,display_name from course_details where assortment_type=\'chapter\') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order desc limit ? OFFSET ?';
                return db.query(sql, [assortmentID, subject, assortmentID, limit, offset]);
            }
            // sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment' and name=?) and resource_type='assortment') as a inner join  (select assortment_id,display_name from course_details where assortment_type='chapter') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order ${tab === 'homework' ? '' : 'desc'} limit ? OFFSET ?`;
            // return db.query(sql, [assortmentID, subject, assortmentID, limit, offset]);
            sql = `SELECT a.*, crm1.course_resource_id, crm1.name,crm1.created_at from
            (select course_resource_id as sub_ass_id, assortment_id as course_ass_id, name as sub_name from course_resource_mapping where assortment_id= ? and resource_type='assortment' and name = ?) as a left join course_resource_mapping as crm1 on a.sub_ass_id = crm1.assortment_id left join course_resource_mapping as crm2 on crm1.course_resource_id=crm2.assortment_id left join course_resource_mapping as crm3 on crm2.course_resource_id=crm3.assortment_id left join course_resources as cr on crm3.course_resource_id=cr.id where crm1.resource_type='assortment' and crm2.resource_type='assortment' and crm3.resource_type='resource' group by crm1.course_resource_id
            order by crm1.created_at, crm3.live_at limit ? OFFSET ?`;
            return db.query(sql, [assortmentID, subject, limit, offset]);
        }
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join  (select assortment_id,display_name from course_details where assortment_type=\'chapter\' and is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order desc limit ? OFFSET ?';
            return db.query(sql, [assortmentID, assortmentID, limit, offset]);
        }
        // sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment') and resource_type='assortment') as a inner join  (select assortment_id,display_name from course_details where assortment_type='chapter') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order ${tab === 'homework' ? '' : 'desc'} limit ? OFFSET ?`;
        if (isMultiple) {
            sql = `SELECT a.*, crm1.course_resource_id, crm1.name,crm1.created_at from
            (select course_resource_id as sub_ass_id, assortment_id as course_ass_id, name as sub_name from course_resource_mapping where assortment_id in (?)and resource_type='assortment') as a left join course_resource_mapping as crm1 on a.sub_ass_id = crm1.assortment_id left join course_resource_mapping as crm2 on crm1.course_resource_id=crm2.assortment_id left join course_resource_mapping as crm3 on crm2.course_resource_id=crm3.assortment_id left join course_resources as cr on crm3.course_resource_id=cr.id where crm1.resource_type='assortment' and crm2.resource_type='assortment' and crm3.resource_type='resource' group by crm1.course_resource_id
            order by crm1.created_at, crm3.live_at limit ? OFFSET ?`;
        } else {
            sql = `SELECT a.*, crm1.course_resource_id, crm1.name,crm1.created_at from
            (select course_resource_id as sub_ass_id, assortment_id as course_ass_id, name as sub_name from course_resource_mapping where assortment_id= ? and resource_type='assortment') as a left join course_resource_mapping as crm1 on a.sub_ass_id = crm1.assortment_id left join course_resource_mapping as crm2 on crm1.course_resource_id=crm2.assortment_id left join course_resource_mapping as crm3 on crm2.course_resource_id=crm3.assortment_id left join course_resources as cr on crm3.course_resource_id=cr.id where crm1.resource_type='assortment' and crm2.resource_type='assortment' and crm3.resource_type='resource' group by crm1.course_resource_id
            order by crm1.created_at, crm3.live_at limit ? OFFSET ?`;
        }
        return db.query(sql, [assortmentID, limit, offset]);
    }

    static getChapterListOfAssortmentVodAll(db, subject, assortmentID, assortmentType, tab = '') {
        let sql = '';
        if (assortmentType === 'subject') {
            sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\'';
            return db.query(sql, [assortmentID]);
        }
        if (subject) {
            if (+assortmentID === 15 || +assortmentID === 16) {
                sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') as a inner join  (select assortment_id,display_name from course_details where assortment_type=\'chapter\') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order desc';
                return db.query(sql, [assortmentID, subject, assortmentID]);
            }
            sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment' and name=?) and resource_type='assortment') as a inner join  (select assortment_id,display_name from course_details where assortment_type='chapter') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order ${tab === 'homework' ? '' : 'desc'}`;
            return db.query(sql, [assortmentID, subject, assortmentID]);
        }
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join  (select assortment_id,display_name from course_details where assortment_type=\'chapter\' and is_active=1) as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order desc';
            return db.query(sql, [assortmentID, assortmentID]);
        }
        sql = `select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type='assortment') and resource_type='assortment') as a inner join  (select assortment_id,display_name from course_details where assortment_type='chapter') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order ${tab === 'homework' ? '' : 'desc'}`;
        return db.query(sql, [assortmentID, assortmentID]);
    }

    static getPastVideoResourcesOfChapter(db, chapterAssortments, batchID = 1) {
        const sql = 'select b.*,a.assortment_id,a.live_at,cd.is_free,cd.parent,cd.display_image_square,ans.*, b.chapter as chapter from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and (live_at < now() or live_at is null) and batch_id=?) as a inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type in (1,8)) as b on b.id=a.course_resource_id inner join (select assortment_id, is_free, parent, display_image_square from course_details) as cd on cd.assortment_id=a.assortment_id left join (select is_vdo_ready,vdo_cipher_id,question_id from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id group by cd.assortment_id order by a.live_at';
        return db.query(sql, [chapterAssortments, batchID]);
    }

    static getUpcomingVideoResourcesOfChapter(db, chapterAssortments, batchID) {
        const sql = 'select b.*,a.assortment_id,a.live_at,cd.is_free,cd.parent,cd.display_image_square,ans.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and (live_at > now() or live_at is null) and batch_id=?) as a inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type in (1,8)) as b on b.id=a.course_resource_id inner join (select assortment_id, is_free, parent, display_image_square from course_details) as cd on cd.assortment_id=a.assortment_id left join (select is_vdo_ready,vdo_cipher_id,question_id from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id group by cd.assortment_id order by a.live_at';
        return db.query(sql, [chapterAssortments, batchID]);
    }

    static getDownloadableQids(db, questionIdList) {
        const sql = 'select is_vdo_ready,vdo_cipher_id,question_id from answers where question_id<>0 and question_id in (?)';
        return db.query(sql, [questionIdList]);
    }

    static getNotesCountInChapter(db, chapterAssortments, batchID) { // 50 ms
        const sql = 'select b.*,crm.assortment_id,crm.name from (select course_resource_id,assortment_id,name from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') as crm left join (select course_resource_id,assortment_id, live_at from course_resource_mapping where resource_type=\'resource\' and (live_at < now() or live_at is null) and batch_id=?) as crm2 on crm2.assortment_id=crm.course_resource_id inner join (select id,resource_type,chapter, meta_info from course_resources) as b on b.id=crm2.course_resource_id  where b.resource_type=2';
        return db.query(sql, [chapterAssortments, batchID]);
    }

    static getDistinctNotesType(db, assortmentID, assortmentType, subject) {
        let sql = null;
        if ((assortmentType === 'course' || assortmentType === 'class') && subject) {
            sql = 'select b.*,a.assortment_id,a.live_at from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\' and name=?) and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select * from course_resources where resource_type=2 and meta_info not in (\'Revision-Sample paper\', \'Revision-Important questions subjective\', \'Revision-Important questions objective\')) as b on b.id=a.course_resource_id';
            return db.query(sql, [assortmentID, subject]);
        }
        if (assortmentType === 'course' || assortmentType === 'class') {
            sql = 'select b.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select id,meta_info from course_resources where resource_type=2 and meta_info is not null and meta_info not in (\'Revision-Sample paper\', \'Revision-Important questions subjective\', \'Revision-Important questions objective\')) as b on b.id=a.course_resource_id group by b.meta_info';
            return db.query(sql, [assortmentID]);
        }
        if (assortmentType === 'subject') {
            sql = 'select b.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select id,meta_info from course_resources where resource_type=2 and meta_info is not null and meta_info not in (\'Revision-Sample paper\', \'Revision-Important questions subjective\', \'Revision-Important questions objective\')) as b on b.id=a.course_resource_id group by b.meta_info';
            return db.query(sql, [assortmentID]);
        }
        if (assortmentType === 'chapter') {
            sql = 'select b.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select id,meta_info from course_resources where resource_type=2 and meta_info is not null and meta_info not in (\'Revision-Sample paper\', \'Revision-Important questions subjective\', \'Revision-Important questions objective\')) as b on b.id=a.course_resource_id group by b.meta_info';
            return db.query(sql, [assortmentID]);
        }
    }

    static getNotesResourcesOfChapter(db, chapterAssortments, notesType, batchID, resourceType) {
        let sql = null;
        if (notesType && notesType !== 'all') {
            sql = 'select trim(b.resource_reference) as resource_reference, b.subject, b.chapter,b.id, b.display as topic,a.assortment_id,a.live_at,1 as is_free,b.meta_info from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=? and (live_at < now() or live_at is null)) as a inner join (select * from course_resources where resource_type=2 and resource_reference like \'https%\' and meta_info=?) as b on b.id=a.course_resource_id group by trim(b.resource_reference) order by a.live_at';
            return db.query(sql, [chapterAssortments, batchID, notesType]);
        }
        sql = 'select trim(b.resource_reference) as resource_reference, b.subject, b.chapter,b.id, b.display as topic,a.assortment_id,a.live_at,1 as is_free,b.meta_info from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=? and (live_at < now() or live_at is null)) as a inner join (select * from course_resources where resource_type=? and resource_reference like \'https%\') as b on b.id=a.course_resource_id group by trim(b.resource_reference) order by a.live_at';
        return db.query(sql, [chapterAssortments, batchID, resourceType]);
    }

    static getPreviousYearPapersResourcesOfChapter(db, chapterAssortments) {
        const sql = 'select b.*,a.assortment_id,a.live_at from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join (select * from course_resources where resource_type in (2) and meta_info in (\'Previous Year Papers\')) as b on b.id=a.course_resource_id';
        return db.query(sql, [chapterAssortments]);
    }

    static getTestResourcesOfChapter(db, chapterAssortments, studentID, batchID) {
        const sql = 'select tss.status,ts.*,b.*,a.assortment_id,a.live_at from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select * from course_resources where resource_type=9) as b on b.id=a.course_resource_id left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=b.resource_reference left join (SELECT test_id, status, completed_at FROM testseries_student_subscriptions WHERE student_id = ? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id order by a.live_at desc';
        return db.query(sql, [chapterAssortments, batchID, studentID]);
    }

    static getPastTestResourcesOfChapter(db, chapterAssortments, studentID, batchID) {
        const sql = 'select tss.status,ts.*,b.*,a.assortment_id,a.live_at from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and live_at < now() and batch_id=?) as a inner join (select * from course_resources where resource_type=9) as b on b.id=a.course_resource_id left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=b.resource_reference left join (SELECT test_id, status, completed_at FROM testseries_student_subscriptions WHERE student_id = ? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id order by a.live_at desc';
        return db.query(sql, [chapterAssortments, batchID, studentID]);
    }

    static getUpcomingTestResourcesOfChapter(db, chapterAssortments, studentID, batchID) {
        const sql = 'select tss.status,ts.*,b.*,a.assortment_id,a.live_at from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and live_at > now() and batch_id=?) as a inner join (select * from course_resources where resource_type=9) as b on b.id=a.course_resource_id left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=b.resource_reference left join (SELECT test_id, status, completed_at FROM testseries_student_subscriptions WHERE student_id = ? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id order by a.live_at';
        return db.query(sql, [chapterAssortments, batchID, studentID]);
    }

    static getBooksResourcesOfAssortment(database, assortmentID, bookType, offset, subject) {
        let sql = '';
        if (subject) {
            sql = 'select a.*,spd.thumbnail_url,spd.id as playlist_id from (select * from assortment_studentid_package_mapping where assortment_id=? and book_type=? and is_active=1) as a inner join (select id, thumbnail_url,student_id,class,subject from studentid_package_details where is_active=1) as spd on spd.class=a.class and spd.student_id=a.student_id and spd.subject=a.subject and spd.subject=? limit 10 OFFSET ?';
            return database.query(sql, [assortmentID, bookType, subject, offset]);
        }
        sql = 'select a.*,spd.thumbnail_url,spd.id as playlist_id from (select * from assortment_studentid_package_mapping where assortment_id=? and book_type=? and is_active=1) as a inner join (select id, thumbnail_url,student_id,class,subject from studentid_package_details where is_active=1) as spd on spd.class=a.class and spd.student_id=a.student_id and spd.subject=a.subject limit 10 OFFSET ?';
        return database.query(sql, [assortmentID, bookType, offset]);
    }

    static getVideoProgressOfStudent(database, studentID, questionID) { // 30 ms
        const sql = 'SELECT *,max(vt) as video_time from (SELECT view_id,answer_id,question_id,video_time as vt from video_view_stats vvs where student_id=? and question_id in (?)) as a inner join (select duration,answer_id from answers where question_id in (?)) as b on b.answer_id=a.answer_id GROUP by a.question_id order by a.view_id desc';
        return database.query(sql, [studentID, questionID.map((x) => +x), questionID.map((x) => +x)]);
    }

    static getMissedClassesForPastDays(database, assortmentID, studentID, assortmentType, offset, batchID) {
        let sql = null;
        if (assortmentType === 'chapter') {
            sql = 'select * from (select course_resource_id,live_at from course_resource_mapping where live_at > DATE_SUB(CURDATE(), INTERVAL 5 DAY) and live_at < now() and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select resource_type,resource_reference,display,stream_status,expert_name,expert_image,id,subject,stream_start_time from course_resources where (resource_type in (1,8,9) OR (resource_type=4 and stream_status=\'ACTIVE\'))) as b on b.id=a.course_resource_id left join (select resource_reference as qid, is_view from liveclass_subscribers where student_id=?) as ls on ls.qid=b.resource_reference and (b.stream_status<>\'ACTIVE\' or b.stream_status is null) left join (select question_id, answer_id, duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference and b.resource_reference in (1,4,8) left join (select test_id, duration_in_min,no_of_questions,title as test_title from testseries ) as ts on ts.test_id=b.resource_reference and b.resource_type=9 left join (select test_id,status from testseries_student_subscriptions where student_id=? and test_id not in (Select test_id from testseries_student_subscriptions where status=\'COMPLETED\' and student_id=?)) as tss on tss.test_id=ts.test_id where (tss.status is null or tss.status=\'SUBSCRIBED\') and (ls.is_view=0 or ls.is_view is null or NOW() < DATE_ADD(b.stream_start_time, INTERVAL ans.duration SECOND)) order by a.live_at desc limit 10 offset ?';
            return database.query(sql, [assortmentID, batchID, studentID, studentID, studentID, offset]);
        }
        if (assortmentType === 'subject') {
            sql = 'select * from (select course_resource_id,live_at from course_resource_mapping where live_at > DATE_SUB(CURDATE(), INTERVAL 5 DAY) and live_at < now() and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select resource_type,resource_reference,display,stream_status,expert_name,expert_image,id,subject,stream_start_time from course_resources where (resource_type in (1,8,9) OR (resource_type=4 and stream_status=\'ACTIVE\'))) as b on b.id=a.course_resource_id left join (select resource_reference as qid, is_view from liveclass_subscribers where student_id=?) as ls on ls.qid=b.resource_reference and (b.stream_status<>\'ACTIVE\' or b.stream_status is null) left join (select question_id, answer_id, duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference and b.resource_reference in (1,4,8) left join (select test_id, duration_in_min,no_of_questions,title as test_title from testseries ) as ts on ts.test_id=b.resource_reference and b.resource_type=9 left join (select test_id,status from testseries_student_subscriptions where student_id=?) as tss on tss.test_id=ts.test_id where (tss.status is null or tss.status=\'SUBSCRIBED\') and (ls.is_view=0 or ls.is_view is null or NOW() < DATE_ADD(b.stream_start_time, INTERVAL ans.duration SECOND)) order by a.live_at desc limit 10 offset ?';
            return database.query(sql, [assortmentID, batchID, studentID, studentID, offset]);
        }
        sql = 'select * from (select course_resource_id,live_at from course_resource_mapping where live_at > DATE_SUB(CURDATE(), INTERVAL 5 DAY) and live_at < now() and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select resource_type,resource_reference,display,stream_status,expert_name,expert_image,id,subject,stream_start_time from course_resources where (resource_type in (1,8,9) OR (resource_type=4 and stream_status=\'ACTIVE\'))) as b on b.id=a.course_resource_id left join (select resource_reference as qid, is_view from liveclass_subscribers where student_id=?) as ls on ls.qid=b.resource_reference and  (b.stream_status<>\'ACTIVE\' or b.stream_status is null) left join (select question_id, answer_id,duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference and b.resource_type in (1,4,8) left join (select test_id, duration_in_min,no_of_questions,title as test_title from testseries ) as ts on ts.test_id=b.resource_reference and b.resource_type=9 left join (select test_id as tid,status from testseries_student_subscriptions where student_id=? and status=\'COMPLETED\') as tss on tss.tid=ts.test_id where tss.status is null and (ls.is_view=0 or ls.is_view is null or NOW() < DATE_ADD(b.stream_start_time, INTERVAL ans.duration SECOND)) order by a.live_at desc limit 10 offset ?';
        return database.query(sql, [assortmentID, batchID, studentID, studentID, offset]);
    }

    static getLiveClassesByAssortmentID(database, assortmentID, batchID) {
        const sql = 'select * from (select course_resource_id,live_at from course_resource_mapping where live_at > CURRENT_DATE() and live_at < now() and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select resource_type,resource_reference,display,stream_status,expert_name,expert_image,id,subject,stream_start_time from course_resources where (resource_type in (1,8) OR (resource_type=4 and stream_status=\'ACTIVE\'))) as b on b.id=a.course_resource_id left join (select question_id, answer_id,duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference where NOW() < DATE_ADD(a.live_at, INTERVAL ans.duration SECOND) order by a.live_at desc';
        return database.query(sql, [assortmentID, batchID]);
    }

    static getMissedTestForLastWeek(database, assortmentID, studentID, batchID) {
        const sql = 'select * from (select course_resource_id,live_at from course_resource_mapping where live_at > DATE_SUB(CURDATE(), INTERVAL 2 DAY) and live_at < now() and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'resource\' and batch_id=?) as a inner join (select resource_type,resource_reference,display,stream_status,expert_name,expert_image,id,subject,stream_start_time from course_resources where resource_type=9) as b on b.id=a.course_resource_id left join (select test_id, duration_in_min,no_of_questions,title as test_title from testseries ) as ts on ts.test_id=b.resource_reference and b.resource_type=9 left join (select test_id,status from testseries_student_subscriptions where student_id=? and status=\'COMPLETED\') as tss on tss.test_id=ts.test_id where tss.status is null order by a.live_at desc limit 1';
        return database.query(sql, [assortmentID, batchID, studentID]);
    }

    static getNcertPlaylistId(database, courseClass) {
        const sql = 'select * from new_library where is_first=1 and is_delete=0 and is_active=1 and student_class=? and description=\'BOOKS_1\'';
        return database.query(sql, [courseClass]);
    }

    static getChapterListOfSubject(database, assortmentId) {
        const sql = 'select * from (select course_resource_id, assortment_id, name as topic_covered from course_resource_mapping where assortment_id=?) as a inner join (select display_name as subject,assortment_id from course_details where is_active=1 and assortment_type=\'subject\') as c on c.assortment_id=a.assortment_id group by a.course_resource_id';
        return database.query(sql, [assortmentId]);
    }

    static getLectureAndNotesListOfSubject(database, assortmentId) {
        const sql = 'select * from (select course_resource_id, assortment_id from course_resource_mapping where assortment_id=?) as a inner join (select display_name as topic_covered,assortment_id from course_details where is_active=1 and assortment_type like \'resource%\') as b on b.assortment_id=a.course_resource_id inner join (select display_name as subject,assortment_id from course_details where is_active=1 and assortment_type=\'chapter\') as c on c.assortment_id=a.assortment_id group by a.course_resource_id';
        return database.query(sql, [assortmentId]);
    }

    static getBanners(database, assortmentId, batchId, type = 'timetable') {
        const sql = 'select * from course_details_banners where assortment_id = ? and is_active=1 and batch_id=? and (start_date<=CURRENT_TIMESTAMP or start_date is null) and (end_date>=CURRENT_TIMESTAMP or end_date is null) and type=? order by banner_order';
        return database.query(sql, [assortmentId, batchId, type]);
    }

    static getDistinctSubjectsByLocaleClass(database, studentClass, locale) {
        const sql = 'select subject,avg(et_per_st) as et_per_st from top_free_classes where class = ? and locale = ? and is_active = 1 group by subject order by et_per_st desc';
        return database.query(sql, [studentClass, locale]);
    }

    static getTopFreeClassesBySubjectClassLocale(database, studentClass, locale, subject) {
        let sql = '';
        if (locale === 'HINDI') {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.hindi_chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? group by a.master_chapter order by a.et_per_st desc limit 5';
        } else {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? group by a.master_chapter order by a.et_per_st desc limit 5';
        }
        return database.query(sql, [studentClass, locale, subject]);
    }

    static getTopFreeClassesBySubjectClassLocaleChapters(database, studentClass, locale, subject, chapters) {
        let sql = '';
        if (locale === 'HINDI') {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.hindi_chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? and a.master_chapter in (?) group by a.master_chapter order by field(a.master_chapter, ?)';
        } else {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? and a.master_chapter in (?) group by a.master_chapter order by field(a.master_chapter, ?)';
        }
        return database.query(sql, [studentClass, locale, subject, chapters, chapters]);
    }

    static getTopFreeClassesBySubjectClassLocaleChapter(database, studentClass, locale, subject, chapter) {
        let sql = '';
        if (locale === 'HINDI') {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.hindi_chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? and a.master_chapter = ? group by a.master_chapter';
        } else {
            sql = 'select a.*,c.image_url as expert_image from top_free_classes a left join chapter_alias_all_lang b on a.master_chapter = b.chapter_alias and a.class = b.class and a.subject = b.subject left join dashboard_users c on c.id = a.expert_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? and a.master_chapter = ? group by a.master_chapter';
        }
        return database.query(sql, [studentClass, locale, subject, chapter]);
    }

    static getQuestionDetailsByQuestionID(database, questionList) {
        const sql = 'select a.*,b.expert_image,b.expert_name from questions a left join course_resources b on a.question_id = b.resource_reference and b.resource_reference in (1,4,8) where a.question_id in (?) order by field(a.question_id, ?)';
        return database.query(sql, [questionList, questionList]);
    }

    static getTopFreeClassesByChapterSubjectClassLocale(database, studentClass, locale, subject, chapter, limit, offset) {
        const sql = 'select * from top_free_classes a left join questions b on a.question_id = b.question_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.subject = ? and a.master_chapter = ? and b.question_id is not null order by a.et_per_st desc limit ? offset ?';
        return database.query(sql, [studentClass, locale, subject, chapter, limit, offset]);
    }

    static getDemoVideoExperiment(database, assortmentId, courseClass) {
        let sql = '';
        if (+assortmentId === 15 || +assortmentId === 16) {
            // 230-270 ms
            sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration from (select *,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?))) left join answers as e on e.question_id=a.question_id group by d.assortment_id';
            return database.query(sql, [assortmentId]);
        }
        // 240-280 ms
        if (_.includes([6, 7, 8, 9, 10], courseClass)) {
            sql = 'select a.*,b.live_at,b.batch_id,d.*,e.answer_id,e.duration, \'demo\' as top_title1,ctm.* from (select id,resource_reference,resource_type,subject,expert_name,faculty_id,expert_image,q_order,player_type,meta_info,display,chapter,duration,stream_status,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8,9)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,display_image_square, meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join answers as e on e.question_id=a.question_id left join (select degree, rating, experience_in_hours, faculty_name, faculty_id, college, students_mentored from course_teacher_mapping where assortment_id=?) as ctm on ctm.faculty_id=a.faculty_id group by b.batch_id, a.subject, a.expert_name order by FIELD(subject, \'ENGLISH\',\'SCIENCE\',\'MATHS\',\'CHEMISTRY\',\'PHYSICS\',\'SOCIAL SCIENCE\',\'INTRODUCTION\',\'GUIDANCE\',\'ANNOUNCEMENT\') desc';
            return database.query(sql, [assortmentId, assortmentId]);
        }
        sql = 'select a.*,b.live_at,b.batch_id,d.*,e.answer_id,e.duration, \'demo\' as top_title1,ctm.* from (select id,resource_reference,resource_type,subject,expert_name,faculty_id, expert_image,q_order,player_type,meta_info,display,chapter,duration,stream_status,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8,9)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,display_image_square, meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join answers as e on e.question_id=a.question_id left join (select degree, rating, experience_in_hours, faculty_name, faculty_id, college, students_mentored from course_teacher_mapping where assortment_id=?) as ctm on ctm.faculty_id=a.faculty_id group by b.batch_id, a.subject, a.expert_name order by FIELD(a.subject, \'ENGLISH\',\'BIOLOGY\',\'MATHS\',\'CHEMISTRY\',\'PHYSICS\',\'INTRODUCTION\',\'GUIDANCE\',\'ANNOUNCEMENT\') desc';
        return database.query(sql, [assortmentId, assortmentId]);
    }

    static getEtoosContinueWatchingVideosByAssortmentID(database, assortmentId, studentID, offset) {
        const sql = 'select *,c.id as resource_id,c.expert_name as mapped_faculty_name,1 as is_free,a.assortment_id as video_assortment from (select * from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) and resource_type=\'assortment\') and resource_type=\'assortment\') and schedule_type=\'recorded\' and is_replay=0 and resource_type=\'resource\') as a inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type in (1,8)) as c on a.course_resource_id=c.id inner join (select question_id,view_id,engage_time, updated_at as view_at from video_view_stats where student_id=?) as vvs on vvs.question_id=c.resource_reference_id left join (select question_id,duration from answers where question_id<>0) as l on l.question_id=c.resource_reference_id where vvs.engage_time < l.duration GROUP by a.assortment_id order by vvs.view_id limit 10 offset ?';
        return database.query(sql, [assortmentId, studentID, offset]);
    }

    static getRelatedVideosOfChapter(database, assortmentId) {
        const sql = 'select *,c.id as resource_id,c.expert_name as mapped_faculty_name,1 as is_free, 1 as is_related, a.assortment_id as video_assortment from (select * from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_resource_mapping where course_resource_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' ) and is_replay=0 and resource_type=\'resource\' and assortment_id<>?) as a inner join (select * from course_resources where resource_type in (1,8)) as c on a.course_resource_id=c.id limit 5';
        return database.query(sql, [assortmentId, assortmentId]);
    }

    static getRelatedVideosAssortmentsOfChapter(database, assortmentId) {
        const sql = 'select course_resource_id from course_resource_mapping where assortment_id in (select assortment_id from course_resource_mapping where course_resource_id=? and resource_type=\'assortment\') and resource_type=\'assortment\' and course_resource_id<>? limit 5';
        return database.query(sql, [assortmentId, assortmentId]);
    }

    static getUserActivePackagesByClassDesc(database, studentID, studentClass) {
        const sql = "select * from (select * from student_package_subscription where student_id=? and is_active=1 and start_date< now() and end_date > now()) as a inner join (select * from package where reference_type in ('v3', 'onlyPanel', 'default')) as b on a.new_package_id=b.id inner join (select assortment_id,assortment_type from course_details where class=?) as c on c.assortment_id=b.assortment_id order by a.created_at desc";
        // console.log(sql);
        return database.query(sql, [studentID, studentClass]);
    }

    static checkForReferralBanner(database, studentID) {
        const sql = "select a.*, c.id as payment_info_id, b.student_id as referrer_student_id from (select * from students_pre_applied_coupons where student_id=? order by id DESC LIMIT 1) as a left join student_referral_course_coupons as b on a.coupon_code=b.coupon_code left join (select * from payment_info where status='SUCCESS' and student_id=?) as c on a.coupon_code = c.coupon_code  where b.student_id != ? and b.id is not null and c.id is null";
        return database.query(sql, [studentID, studentID, studentID]);
    }

    static getCoursesForHomepageWithThumbnailsByCategory(database, studentClass, studentLocale, widgetType, versionCode) {
        let sql;
        if (studentLocale === 'hi') {
            sql = 'select * from (select * from course_details cd where cd.assortment_type=\'course\' and cd.class=? and cd.is_active=1 and is_free=0 and parent<>4 and cd.assortment_id not in (15,16) UNION select * from course_details where assortment_id=138829 and class=? and is_active = 1) as a inner join (select image_url as image_thumbnail, assortment_id as course_thumbnail_assortment_id from course_details_thumbnails where class = ? and is_active = 1 and type = ? and min_version_code <= ? and max_version_code >= ?) as b on a.assortment_id = b.course_thumbnail_assortment_id order by a.meta_info desc, FIELD(category,\'IIT JEE\',\'NEET\'), a.created_at desc';
        } else {
            sql = 'select * from (select * from course_details cd where cd.assortment_type=\'course\' and cd.class=? and cd.is_active=1 and is_free=0 and parent<>4 and cd.assortment_id not in (15,16) UNION select * from course_details where assortment_id=138829 and class=? and is_active = 1) as a inner join (select image_url as image_thumbnail, assortment_id as course_thumbnail_assortment_id from course_details_thumbnails where class = ? and is_active = 1 and type = ? and min_version_code <= ? and max_version_code >= ?) as b on a.assortment_id = b.course_thumbnail_assortment_id order by a.meta_info, FIELD(category,\'IIT JEE\',\'NEET\'), a.created_at desc';
        }
        return database.query(sql, [studentClass, studentClass, studentClass, widgetType, versionCode, versionCode]);
    }

    static getAssortmentDetailsFromIdWithCourseThumbnails(database, assortmentId, widgetType, versionCode, studentClass) {
        let sql;
        let params;
        if (!studentClass) {
            sql = 'select cd.*, crm.schedule_type from (select a.*,b.image_url as image_thumbnail from course_details a left join course_details_thumbnails b on a.assortment_id = b.assortment_id and a.class = b.class where a.assortment_id in (?) and b.type = ? and b.is_active = 1 and a.is_active = 1 and min_version_code <= ? and max_version_code >= ?) as cd inner join (select assortment_id, schedule_type from course_resource_mapping where assortment_id in (?)) as crm on crm.assortment_id=cd.assortment_id left join (select assortment_id,course_id from vod_class_subject_course_mapping) as vcm on vcm.assortment_id=cd.assortment_id GROUP by crm.assortment_id';
            params = [assortmentId, widgetType, versionCode, versionCode, assortmentId];
        } else {
            sql = 'select a.*,b.image_url as image_thumbnail from course_details a left join course_details_thumbnails b on a.assortment_id = b.assortment_id and a.class = b.class where a.assortment_id in (?) and a.class=? and b.type = ? and b.is_active = 1 and b.min_version_code <= ? and b.max_version_code >= ?';
            params = [assortmentId, studentClass, widgetType, versionCode, versionCode];
        }
        // console.log(sql);
        return database.query(sql, params);
    }

    static getStudentLastAdWatchedToday(database, studentId) {
        // 105 ms
        const sql = 'select a.ad_id from course_ads_view_stats_1 as a inner join course_ads_engagetime_stats_1 as b on a.uuid=b.uuid where a.student_id = ? and a.is_LF = 0 order by a.created_at desc limit 1';
        return database.query(sql, [studentId]);
    }

    static getAllChaptersUsingSubjectAssortment(database, subjectAssortmentID) {
        const sql = 'select name,course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = \'assortment\'';
        return database.query(sql, [subjectAssortmentID]);
    }

    static getAllCourseReviews(database, superCategory, meta, courseClass, assortmentId, category) {
        /* 120-200 ms */
        const sql = 'select * from course_reviews where (super_category=? or super_category is null) and review_meta=? and (review_class=? or review_class is null) and (assortment_id is null or assortment_id=?) and (category is null or category = ?) and is_active=1 order by review_order';
        return database.query(sql, [superCategory, meta, courseClass, assortmentId, category]);
    }

    static getCourseReviews(database, superCategory, meta, courseClass) {
        /* 120-200 ms */
        const sql = 'select * from course_reviews where (super_category=? or super_category is null) and review_meta=? and (review_class=? or review_class is null) and assortment_id is null and category is null and is_active=1 order by review_order';
        return database.query(sql, [superCategory, meta, courseClass]);
    }

    static getCourseReviewsByAssortmentId(database, assortmentId, superCategory, meta, courseClass) {
        // around 120 ms
        const sql = 'select * from course_reviews where (super_category=? or super_category is null) and review_meta=? and (review_class=? or review_class is null) and assortment_id = ? and is_active=1 order by review_order';
        return database.query(sql, [superCategory, meta, courseClass, assortmentId]);
    }

    static getCourseReviewsByCategory(database, superCategory, category, meta, courseClass) {
        // around 120 ms
        const sql = 'select * from course_reviews where (super_category=? or super_category is null) and review_meta=? and (review_class=? or review_class is null) and assortment_id is null and category = ? and is_active=1 order by review_order';
        return database.query(sql, [superCategory, meta, courseClass, category]);
    }

    static getCourseDetailsFromQuestionId(database, questionID) {
        const sql = 'select cd.*, a.*, case when du.image_url_left_full is null then du.image_url ELSE du.image_url_left_full end  as expert_image2 from (select * from course_resources where resource_reference=? and resource_type in (1,4,8)) as a inner join (select assortment_id, course_resource_id, resource_type from course_resource_mapping where resource_type=\'resource\') as crm1 on a.id=crm1.course_resource_id left join (select assortment_id, course_resource_id from course_resource_mapping where resource_type=\'assortment\') as crm2 on crm1.assortment_id=crm2.course_resource_id left join (select assortment_id, course_resource_id, resource_type from course_resource_mapping where resource_type=\'assortment\') as crm3 on crm2.assortment_id=crm3.course_resource_id left join (select assortment_id, course_resource_id, resource_type from course_resource_mapping where resource_type=\'assortment\') as crm4 on crm3.assortment_id=crm4.course_resource_id inner join (select * from course_details where is_active=1) as cd on cd.assortment_id=crm4.assortment_id left join dashboard_users as du on a.faculty_id=du.id group by cd.assortment_id, cd.class';
        return database.query(sql, [questionID]);
    }

    static getInternalSubscriptions(database, studentID) {
        const sql = 'select * from internal_subscription where student_id=?';
        return database.query(sql, [studentID]);
    }

    static getScholarshipTestProgress(database, studentID) {
        const sql = 'select * from scholarship_test where student_id = ? and is_active = 1';
        return database.query(sql, [studentID]);
    }

    static getScholarshipCoupon(database, studentID) {
        const sql = 'select coupon_code,discount_percent from scholarship_test where student_id = ?';
        return database.query(sql, [studentID]);
    }

    static getChapterListOfAssortmentWithoutOffset(db, assortmentID) {
        let sql = '';
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc';
            return db.query(sql, [assortmentID, assortmentID]);
        }
        sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join (select assortment_id, display_name from course_details) as cd on cd.assortment_id=a.course_resource_id left join (select assortment_id,liveclass_course_id from course_details_liveclass_course_mapping) as b on b.assortment_id=? left join (select course_id,chapter,chapter_order from master_chapter_mapping) as mcm on mcm.course_id=b.liveclass_course_id and mcm.chapter=cd.display_name group by cd.assortment_id order by -mcm.chapter_order desc';
        return db.query(sql, [assortmentID, assortmentID]);
    }

    static getChapterListOfAssortmentVodWithoutOffset(db, assortmentID) {
        let sql = '';
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select a.* from (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') and resource_type=\'assortment\') and resource_type=\'assortment\') as a inner join  (select assortment_id,display_name from course_details where assortment_type=\'chapter\') as cd on cd.assortment_id=a.course_resource_id left join (select * from vod_class_subject_course_mapping) as b on b.assortment_id=? left join (select * from vod_chapter_mapping) as vcm on vcm.class=b.class and vcm.subject=b.subject and vcm.state=b.state and vcm.language=b.language and vcm.chapter=cd.display_name group by cd.assortment_id order by -vcm.chapter_order desc';
            return db.query(sql, [assortmentID, assortmentID]);
        }
        sql = 'select crm1.course_resource_id from (select assortment_id,course_resource_id,name from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') as a left join course_resource_mapping as crm1 on a.course_resource_id=crm1.assortment_id and crm1.resource_type = \'assortment\' where a.name not in (\'ALL\',\'INTRODUCTION\',\'GUIDANCE\')';
        return db.query(sql, [assortmentID]);
    }

    static getPastMissedWeeklyTestsResourcesOfChapter(db, assortmentID, studentID, batchID) {
        const sql = 'SELECT * from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id in (?) and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id  left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=cr.resource_reference and cr.resource_type = 9 left join (SELECT test_id, student_id, max(case when status is null then 0 when status = \'COMPLETED\' then 0 else 1 end)as completion_status, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.test_id=ts.test_id where cr.resource_type = 9 and d.live_at <CURRENT_TIMESTAMP and (tss.completion_status=0 or tss.completion_status is null or tss.completion_status<>\'COMPLETED\')';
        return db.query(sql, [assortmentID, batchID, studentID]);
    }

    static getStudentRecordFromBNBClickersTable(db, studentID) { // * 40ms
        const sql = 'SELECT student_id from bnb_clickers where student_id = ?';
        return db.query(sql, [studentID]);
    }

    static insertIntoBNBClickers(db, studentID, isActive, isSent, metaInfo) { // * 40-50ms
        const sql = 'insert into bnb_clickers (student_id, is_active, is_sent, meta_info) values (?, ?, ?, ?)';
        return db.query(sql, [studentID, isActive, isSent, metaInfo]);
    }

    static getFiltersFromCourseDetails(db, studentClass) { // 10 ms
        const sql = 'select DISTINCT (case when category_type =\'BOARDS/SCHOOL/TUITION\' then category else CONCAT(category_type,\'_\',\'CT\') end) as category, year_exam, meta_info from course_details where is_active=1 and assortment_type = \'course\' and is_free=0 and parent<>4 and class=?';
        return db.query(sql, [studentClass]);
    }

    static getAllChapterDetails(db) { // 3.2ms
        const sql = 'SELECT assortment_id, meta_info as medium,class,display_name as course_name,category_type FROM course_details where assortment_type = "course" and is_active = 1 and year_exam = 2022 and is_free = 1';
        return db.query(sql);
    }

    static getCoursesForHomepageWeb(db) { // * 150-170ms
        // const sql = 'SELECT assortment_id, assortment_type, display_name, category, class, meta_info, subtitle, demo_video_qid, demo_video_thumbnail, concat(meta_info) as course_lang, end_date, start_date FROM `course_details` where assortment_type = \'course\' and is_active = 1 and is_free = 0 and class not in (13,14) and (year_exam = 2021 or year_exam = 2022) and is_active_sales = 1 and assortment_id <> 138829 and priority < 10 order by priority';
        const sql = `SELECT assortment_id, assortment_type,display_name, category, class, meta_info, subtitle, demo_video_qid, demo_video_thumbnail, concat(meta_info) as course_lang, end_date, start_date FROM course_details where assortment_type = 'course' and is_active = 1 and is_free = 0 and class not in (13,14) and is_active_sales = 1 and assortment_id <> 138829 and (year_exam = ${moment().add(5, 'h').add(30, 'minutes').format('YYYY')} or year_exam = ${moment().add(5, 'h').add(30, 'minutes').add(1, 'years')
            .format('YYYY')} or year_exam = ${moment().add(5, 'h').add(30, 'minutes').add(2, 'years')
            .format('YYYY')} or year_exam = ${moment().add(5, 'h').add(30, 'minutes').add(3, 'years')
            .format('YYYY')}) and is_show_web = 1 order by priority`;
        return db.query(sql);
    }

    static getCoursesListForWeb(database, category, studentClass) {
        let sql;
        let categoryTypes = [];
        let categories = [];
        if (category && category.length) {
            const categoryTypesMapped = category.filter((item) => item.split('_')[1] === 'CT');
            categories = category.filter((item) => !_.includes(categoryTypesMapped, item));
            categoryTypes = categoryTypesMapped.map((item) => item.split('_')[0]);
        }
        if (category && category.length && categoryTypes.length && categories.length && studentClass) { // * 100ms
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where (category_type in (?) or category in (?)) and class=? and is_active=1 and assortment_type=\'course\' and parent<>4 and is_free = 0 and is_show_web = 1) as cd  left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by priority';
            return database.query(sql, [categoryTypes, categories, studentClass]);
        }
        if (category && category.length && categoryTypes.length && studentClass) { // * 150ms
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where category_type in (?) and class=? and is_active=1 and assortment_type=\'course\' and parent<>4 and is_free = 0 and is_show_web = 1) as cd  left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by priority';
            return database.query(sql, [categoryTypes, studentClass]);
        }
        if (category && category.length && categories.length && studentClass) { // * 150ms
            sql = 'select cd.*,cdlcm.liveclass_course_id from (select * from course_details where is_active=1 and assortment_type=\'course\' and class= ? and category in (?) and parent<>4 and is_free = 0 and is_show_web = 1) as cd left JOIN (select liveclass_course_id,assortment_id from course_details_liveclass_course_mapping ) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by priority';
            return database.query(sql, [studentClass, category, studentClass]);
        }
        if (studentClass) { // * 60ms
            sql = 'select * from course_details where is_active=1 and assortment_type=\'course\' and class= ? and parent<>4 and is_free = 0 and is_show_web = 1 order by priority';
            return database.query(sql, [studentClass]);
        }
        sql = 'select * from course_details where is_active=1 and assortment_type=\'course\' and parent<>4 and is_free = 0 and is_show_web = 1 order by priority'; // * 150-200ms
        return database.query(sql);
    }

    static getFreeAssortmentsByCategory(db, category, studentClass) { // 5ms
        const sql = 'SELECT assortment_id FROM course_details where assortment_type = "course" and is_active = 1 and is_free = 1 and category=? and class=?';
        return db.query(sql, [category, studentClass]);
    }

    static getCourseSchedule(db, assortmentId, subject = null, batchID) {
        const sql = `SELECT * FROM (SELECT * FROM liveclass_schedule_all WHERE assortment_id = ? and is_active=1 and batch_id=? ${subject ? ' AND subject = ?' : ''}) as lsa left join (select * from course_assortment_batch_mapping) as abm on abm.assortment_id=lsa.assortment_id and abm.batch_id=lsa.batch_id`;
        return db.query(sql, [assortmentId, batchID, subject]);
    }

    static getAssortmentSubject(db, assormentId, subject) {
        // 20-30 ms
        const sql = 'select course_resource_id from course_resource_mapping where assortment_id=? and name=?';
        return db.query(sql, [assormentId, subject]);
    }

    static getCourseAdDataQid(db, studentClass, subject) {
        // 40 ms
        const sql = 'select * from (select * from course_ads where target_class=? and target_video_subject=? and is_active=1 and ad_type in (\'QID\') and (ads_endtime is null or ads_endtime > CURRENT_TIMESTAMP)) as a left join answers as b on a.ad_qId=b.question_id left join (select * from answer_video_resources where resource_type=\'BLOB\') as c on b.answer_id=c.answer_id';
        return db.query(sql, [studentClass, subject]);
    }

    static getDemoVideoSubject(database, assortmentId) {
        // 140 ms
        const sql = 'select a.*,b.live_at,b.batch_id,d.*,e.answer_id,e.duration,\'demo\' as top_title1 from (select id,resource_reference,resource_type,subject,expert_name,expert_image,q_order,player_type,meta_info,display,chapter,duration,stream_status,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?) left join answers as e on e.question_id=a.question_id group by d.assortment_id, a.expert_name';
        return database.query(sql, [assortmentId]);
    }

    static getFAQsBySubjectAssortment(database, assortmentId, locale) {
        // 40 ms
        const sql = 'select * from faq where bucket = CONCAT(\'subject_\',?,\'_\',?) and is_active=1 and locale=? order by priority';
        return database.query(sql, [assortmentId, locale, locale]);
    }

    static getLFAdData(db, studentClass, subject) {
        // 145 ms
        const sql = 'select * from (select * from course_ads_LF where target_class=? and target_video_subject=? and is_active=1) as a left join answers as b on a.ad_qId=b.question_id left join (select * from answer_video_resources where resource_type=\'BLOB\') as c on b.answer_id=c.answer_id';
        return db.query(sql, [studentClass, subject]);
    }

    static getStudentAdsWatchedTodayLF(database, studentId) {
        // 110 ms
        const sql = 'select count(*) as watch_count from course_ads_view_stats_1 as a inner join course_ads_engagetime_stats_1 as b on a.uuid=b.uuid where a.student_id = ? and a.is_LF = 1 and b.created_at >= CURDATE() and b.created_at < CURDATE() + INTERVAL 1 DAY';
        return database.query(sql, [studentId]);
    }

    static getAdLifetimeWatchLF(database, adId, studentId) {
        // 120 ms
        const sql = 'select count(*) as watch_count from course_ads_view_stats_1 as a inner join course_ads_engagetime_stats_1 as b on a.uuid=b.uuid where a.ad_id = ? and a.student_id = ? and a.is_LF = 1';
        return database.query(sql, [adId, studentId]);
    }

    static addCourseAdsViewStatsLF(database, uuid, adId, studentId) {
        // 160 ms
        const sql = 'INSERT INTO course_ads_view_stats_1 (uuid, ad_id, student_id, is_LF) VALUES ( ?, ?, ?, 1)';
        return database.query(sql, [uuid, adId, studentId]);
    }

    static getResourceDetailsFromIdWithoutClass(db, assortmentIds, resourceTypes, limit, offset) { // * 100-120ms
        const sql = 'select c.*,b.live_at, a.assortment_id, a.is_free, case when faculty_name is null then c.expert_name else faculty_name end as mapped_faculty_name,case when f.image_url is NULL then c.expert_image else f.image_url end as image_bg_liveclass, f.degree from (select assortment_id, display_name, display_image_square, is_free from course_details where assortment_id in (?) and assortment_type like \'resource%\') as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at<=CURRENT_TIMESTAMP) as b on a.assortment_id=b.assortment_id inner join (select id, resource_reference, resource_type, subject, topic, expert_name, expert_image, q_order, class, player_type, meta_info, tags, name, display, description, chapter, chapter_order, exam, board, ccm_id, book, faculty_id, stream_start_time, image_url, locale, vendor_id, duration, created_at, created_by, rating, old_resource_id, stream_end_time, stream_push_url, stream_vod_url, stream_status, old_detail_id, lecture_type, stream_status as is_active from course_resources where resource_type in (?)) as c on b.course_resource_id=c.id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree,raw_image_url as image_url from etoos_faculty) as f on c.faculty_id=f.id order by field(a.assortment_id, ?) limit ? offset ?';
        return db.query(sql, [assortmentIds, resourceTypes, assortmentIds, limit, offset]);
    }

    static getResourcesFromResourceAssortments(db, assortmentIds) { // * 90-100ms
        const sql = 'select b.*,a.assortment_id,a.live_at,cd.is_free,cd.parent,cd.display_image_square,ans.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (?) and resource_type=\'resource\') as a inner join (select *,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type in (1,4,8)) as b on b.id=a.course_resource_id inner join (select assortment_id, is_free, parent, display_image_square from course_details) as cd on cd.assortment_id=a.assortment_id left join (select is_vdo_ready,vdo_cipher_id,question_id from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id group by cd.assortment_id order by field(a.assortment_id, ?)';
        return db.query(sql, [assortmentIds, assortmentIds]);
    }

    static getChapterAssormtentsFromSubjectAndChapter(db, subject, chapterAssortments) { // * 60-70ms
        const sql = 'select crm2.assortment_id from course_resource_mapping crm1 left join course_resource_mapping crm2 on crm1.assortment_id = crm2.course_resource_id and crm2.resource_type = \'assortment\' where crm1.assortment_id in (select a.assortment_id from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\') as a inner join course_resources as b on a.course_resource_id = b.id where b.subject = ?) and crm1.resource_type =\'resource\' group by crm2.assortment_id';
        return db.query(sql, [chapterAssortments, subject]);
    }

    static getUserSubjectsFromChapterAssortments(db, chapterAssortments) { // * 50-60ms
        const sql = 'select cr.subject from course_resource_mapping crm1 left join course_resource_mapping crm2 on crm2.assortment_id = crm1.course_resource_id left join course_resources cr on cr.id = crm2.course_resource_id where crm1.assortment_id in (?) group by cr.subject';
        return db.query(sql, [chapterAssortments]);
    }

    static getLiveClassCourseFromAssortment(db, assortmentID) { // * 50-60ms
        const sql = 'select * from course_details_liveclass_course_mapping where assortment_id=?';
        return db.query(sql, [assortmentID]);
    }

    static getDistinctClassWiseCoursesPurchasedByStudent(database, student_id) {
        const sql = `
        SELECT
                t1.student_id,
                count(t1.class) AS class_count
            FROM
                (SELECT
                    a.student_id,
                    cd.class
                FROM
                    student_package_subscription AS a
                LEFT JOIN
                    package AS pkg
                        ON a.new_package_id = pkg.id
                LEFT JOIN
                    (
                        SELECT
                            course_details.assortment_id,
                            course_details.assortment_type,
                            min(class) AS class
                        FROM
                            course_details
                        WHERE
                            (
                                course_details.assortment_type IN (
                                    'course', 'subject'
                                )
                            )
                        GROUP BY
                            1,
                            2
                        ORDER BY
                            NULL
                    ) AS cd
                        ON pkg.assortment_id = cd.assortment_id
                LEFT JOIN
                    internal_subscription AS ins
                        ON a.student_id = ins.student_id
                LEFT JOIN
                    payment_summary AS ps
                        ON a.id = ps.subscription_id
                WHERE
                    (
                        1 = 1
                        AND 1 = 1
                        AND ins.student_id IS NULL
                        AND 1 = 1
                        AND (
                            lower(ps.coupon_code) <> 'internal'
                            OR ps.coupon_code IS NULL
                        )
                    )
                    AND (
                        (
                            (
                                a.student_id = ${student_id}
                            )
                            AND (
                                a.is_active = 1
                            )
                        )
                        AND (
                            a.amount >= 0
                        )
                    )
                GROUP BY
                    cd.class
                ORDER BY
                    NULL) t1`;
        return database.query(sql);
    }

    static getScholarshipExams(db, locale) { // * 50-60ms
        const sql = 'select * from scholarship_exam where is_active = 1';
        return db.query(sql, [locale]);
    }

    static getScholarshipLeaderByTest(db, testId) { // * 30 ms
        const sql = 'select a.rank,a.discount_percent,a.marks,a.student_id,a.use_name,b.img_url,b.student_fname,b.student_lname,b.mobile from scholarship_test as a inner join students as b on a.student_id=b.student_id where a.test_id in (?) and a.rank is not null order by cast(a.rank as unsigned) asc limit 20';
        return db.query(sql, [testId]);
    }

    static getStudentScholarshipRank(db, testId, studentId) { // * 50 ms
        const sql = 'select a.rank,a.discount_percent,a.marks,a.student_id,b.img_url,b.student_fname,b.student_lname,b.mobile from scholarship_test as a inner join students as b on a.student_id=b.student_id where a.test_id = ? and a.student_id = ?';
        return db.query(sql, [testId, studentId]);
    }

    static getScholarshipResultBanner(db, couponCode, locale) { // * 20ms
        const sql = 'select * from scholarship_banners where type=\'discount\' and coupon_code=? and locale=? and is_active = 1';
        return db.query(sql, [couponCode, locale]);
    }

    static getAppConfigurationContent(db, keyName) { // * 50-60ms
        const sql = 'select * from app_configuration where is_active=1 and key_name=?';
        return db.query(sql, [keyName]);
    }

    static getScholarshipAppBanner(db, locale, progress, testId) { // * 20ms
        let sql;
        if (locale === null) {
            sql = 'select * from scholarship_banners where type=\'course_page\' and progress_id=? and test_id=? and is_active = 1';
            return db.query(sql, [progress, testId]);
        }
        sql = 'select * from scholarship_banners where type=\'course_page\' and locale = ? and progress_id=? and test_id=? and is_active = 1';
        return db.query(sql, [locale, progress, testId]);
    }

    static getScholarshipAppGeneralBanner(db, testId, locale, progress) { // * 20ms
        const sql = 'select * from scholarship_banners where test_id = ? and type=\'general\' and locale=? and progress_id=? and is_active = 1';
        return db.query(sql, [testId, locale, progress]);
    }

    static getDistinctSelectionsFromCourseDetails(db) { // 30 ms
        const sql = 'select DISTINCT class, category, year_exam from course_details where is_active=1 and assortment_type = \'course\' and is_free=0 and parent<>4 and start_date < CURRENT_TIMESTAMP and end_date > CURRENT_TIMESTAMP and class > 5';
        return db.query(sql);
    }

    static getDistinctSelectionsFromCourseDetailsApp(db) { // 30 ms
        const sql = 'select DISTINCT class, category, year_exam, category_type, meta_info from course_details where is_active=1 and assortment_type = \'course\' and is_free=0 and parent<>4 and start_date < CURRENT_TIMESTAMP and end_date > CURRENT_TIMESTAMP and class > 5';
        return db.query(sql);
    }

    static getPaymentSummaryBySubscription(db, subscriptionId) { // 30 ms
        const sql = 'select payment_type from payment_summary where subscription_id=?';
        return db.query(sql, [subscriptionId]);
    }

    static setRequestCallbackData(database, data) {
        console.log(data);
        const query = 'INSERT IGNORE INTO course_calling_card_callback_logs set ?';
        return database.query(query, [data]);
    }

    static setRequestActivityData(database, data) {
        const query = 'INSERT IGNORE INTO panel_student_query_activity set ?';
        return database.query(query, [data]);
    }

    static setRequestTicketData(database, data) {
        const query = 'INSERT IGNORE INTO panel_student_query_ticket set ?';
        return database.query(query, [data]);
    }

    static updateScholarshipTestLate(database, studentId, testId, oldTestId, defaultCoupon, discountPercent) {
        const sql = 'update scholarship_test set test_id = ?, coupon_code = ?, discount_percent = ? where student_id = ? and test_id = ?';
        return database.query(sql, [testId, defaultCoupon, discountPercent, studentId, oldTestId]);
    }

    static getScholarshipMatch(db, testId) {
        const sql = 'select * from scholarship_exam where is_active=1 and test_id=?';
        return db.query(sql, [testId]);
    }

    static getCallBackLogsDetails(db, studentID, subscriptionId) { // 30 ms
        const sql = 'select * from course_calling_card_callback_logs where student_id=? and active_subscription_id=?';
        return db.query(sql, [studentID, subscriptionId]);
    }

    static getOtherLanguageCourse(db, assortmentId, locale) { // * 40 ms
        let sql;
        if (locale === 'HINDI') {
            sql = 'SELECT english_assortment_id from course_hindi_english_mapping where hindi_assortment_id = ?';
            return db.query(sql, [assortmentId]);
        }
        sql = 'SELECT hindi_assortment_id from course_hindi_english_mapping where english_assortment_id = ?';
        return db.query(sql, [assortmentId]);
    }

    static getNextLectureOfSameSubject(database, qIds, batchID) {
        const sql = 'select *, min(live_at) from (SELECT cr2.*, 1 as is_free, \'upNext\' as top_title1, crm6.live_at from (SELECT * FROM course_resources WHERE resource_reference in (?) and resource_type in (1,8)) as cr left join course_resource_mapping crm1 on cr.id=crm1.course_resource_id and crm1.resource_type=\'resource\' and crm1.batch_id=? left join course_resource_mapping crm2 on crm1.assortment_id=crm2.course_resource_id and crm2.resource_type=\'assortment\' left join course_resource_mapping crm3 on crm2.assortment_id=crm3.course_resource_id and crm3.resource_type=\'assortment\' left join course_resource_mapping crm4 on crm3.assortment_id=crm4.assortment_id and crm4.resource_type=\'assortment\' left join course_resource_mapping crm5 on crm4.course_resource_id=crm5.assortment_id and crm5.resource_type=\'assortment\' left join course_resource_mapping crm6 on crm5.course_resource_id=crm6.assortment_id and crm6.resource_type=\'resource\' and crm6.batch_id=? and (crm6.live_at < now() or crm6.live_at is null) left join course_resources cr2 on crm6.course_resource_id=cr2.id where cr2.resource_type in (1,8) and cr2.id>cr.id group by cr2.resource_reference) as f group by f.subject order by FIELD (resource_reference, ?)';
        return database.query(sql, [qIds, batchID, batchID, qIds]);
    }

    static getResourcesDataFromQuestionIdsList(database, qIds, batchID) {
        const sql = 'SELECT cr.*, cd.is_free, cd.class,\'continueWatching\' as top_title1,crm1.live_at from (SELECT *  FROM course_resources WHERE resource_reference in (?) and resource_type in (1,8)) as cr left join course_resource_mapping crm1 on cr.id=crm1.course_resource_id and crm1.resource_type=\'resource\' and crm1.batch_id=? left join course_details cd on cd.assortment_id=crm1.assortment_id group by cr.resource_reference order by FIELD (resource_reference, ?)';
        return database.query(sql, [qIds, batchID, qIds]);
    }

    static getCourseByParams(database, studentClass, category, categoryType, locale) {
        let sql = 'select * from course_details where class= ? and category=? and category_type=? and meta_info=? and assortment_type=\'course\' and is_active=1 and is_free=0 and start_date < CURRENT_TIMESTAMP and end_date > CURRENT_TIMESTAMP order by created_at desc';
        let params = [studentClass, category, categoryType, locale];
        if (categoryType == '') {
            sql = 'select * from course_details where class= ? and category=? and meta_info=? and assortment_type=\'course\' and is_active=1 and is_free=0 and start_date < CURRENT_TIMESTAMP and end_date > CURRENT_TIMESTAMP order by created_at desc';
            params = [studentClass, category, locale];
        }
        if (categoryType === 'SPOKEN ENGLISH' || categoryType === 'ENGLISH GRAMMAR') {
            sql = 'select * from course_details where class= ? and category_type=? and assortment_type=\'course\' and is_active=1 and is_free=0 and is_free=0 order by created_at desc'; // and start_date < CURRENT_TIMESTAMP and end_date > CURRENT_TIMESTAMP
            params = [studentClass, categoryType];
        }
        return database.query(sql, params);
    }

    static getOldTestData(db, studentId) { // 45 ms
        const sql = 'SELECT st.test_id,se.type,tsr.eligiblescore,tsr.totalmarks,tsr.created_at,se.test_name  FROM scholarship_test st left join testseries_student_reportcards tsr on st.student_id=tsr.student_id and st.test_id=tsr.test_id left join scholarship_exam se on se.test_id=st.test_id WHERE st.student_id = ? and st.progress_id = 4 and st.marks is not null and st.rank is not null and se.type like \'DNST%\'';
        return db.query(sql, [studentId]);
    }

    static getScholarshipTestResult(database, studentId, testId) {
        const sql = 'select * from scholarship_test where student_id=? and test_id=?';
        return database.query(sql, [studentId, testId]);
    }

    static getScholarshipExamsResults(db, testId) { // * 50-60ms
        const sql = 'select * from scholarship_exam where test_id = ?';
        return db.query(sql, [testId]);
    }

    static getScholarshipRules(db, testId) { // * 50-60ms
        const sql = 'select test_id,rule_text,rule_id from testseries ts left join testseries_rules tr on ts.rule_id=tr.id where test_id =?';
        return db.query(sql, [testId]);
    }

    static checkIfCODActivation(db, studentId) {
        const sql = 'select sps.end_date, pi.variant_id from payment_info_shiprocket pis join payment_info pi on pi.id = pis.payment_info_id join variants v on v.id = pi.variant_id join package p on p.id = v.package_id join student_package_subscription sps on sps.id = pis.sps_id where pis.student_id = ? and pis.order_status in ("DELIVERED", "OUT FOR DELIVERY") and pis.is_active = 1 and pis.is_otp_verified = 1 and sps.end_date > now()';
        return db.query(sql, [studentId]);
    }

    static getLastestBatchByAssortment(db, assortmentId) {
        const sql = 'select *, batch_start_date as start_date, batch_end_date as end_date from course_assortment_batch_mapping where assortment_id=? and is_active=1 order by batch_start_date desc';
        return db.query(sql, [assortmentId]);
    }

    static getCoursesClassCourseMappingBasedOnCcm(db, ccmId, studentClass) { // * 20ms
        const sql = 'SELECT ccm.* from class_course_mapping ccm join (SELECT * from class_course_mapping ccm where id=?) a on a.course=ccm.course and a.category=ccm.category where ccm.class = ?';
        return db.query(sql, [ccmId, studentClass]);
    }

    static getQuizLogsFromVod(db, resourceReference) { // 60-70 ms
        const sql = 'select *, a.live_at as vod_live_at from (select * from vod_schedule where question_id = ? and is_processed = 1) as a inner join (select * from vod_schedule_widget_mapping where widget_type=\'QUIZ\') as b on a.id=b.vod_schedule_id';
        // console.log(mysql.format(sql, [+resourceReference]));
        return db.query(sql, [+resourceReference]);
    }

    static getPollLogsFromVod(db, resourceReference, resourceId) { // 30-50ms
        const sql = 'select *, a.live_at as vod_live_at, d.id as id, ? as liveclass_resource_id from (select * from vod_schedule where question_id = ?) as a left join (select * from vod_schedule_widget_mapping where widget_type=\'POLL\') as b on a.id=b.vod_schedule_id left join (select * from liveclass_polls) as c on b.widget_data=c.id left join (select * from liveclass_publish where detail_id = ?) as d on b.widget_data=d.info';
        // console.log(mysql.format(sql, [resourceId, +resourceReference, resourceId]));
        return db.query(sql, [resourceId, +resourceReference, resourceId]);
    }

    static getQuizResource(database, resourceReference) { // 40-50 ms
        const sql = 'select a.stream_start_time, a.old_detail_id, d.id as quiz_resource_id, a.id as liveclass_resource_id from (select * from course_resources where resource_type in (1,4) and resource_reference=?) as a left join (select * from course_resource_mapping where resource_type=\'RESOURCE\') as b on a.id=b.course_resource_id left join (select * from course_resource_mapping where resource_type=\'RESOURCE\') as c on b.assortment_id=c.assortment_id inner join (select * from course_resources where resource_type=7) as d on c.course_resource_id=d.id limit 1';
        console.log(sql);
        return database.query(sql, [resourceReference.toString()]);
    }

    static getCourseAssortmentBatchMappings(db, assortmentList) { // * 20ms
        const sql = 'select * from course_assortment_batch_mapping where assortment_id in (?) and is_active=1 order by batch_id desc';
        return db.query(sql, [assortmentList]);
    }

    static getActiveShiprocketOrderInfoByStudentId(database, studentId) {
        const sql = 'select pi.variant_id, cd.*, pis.order_status from payment_info_shiprocket pis join payment_info pi on pi.id = pis.payment_info_id join variants v on v.id= pi.variant_id left join package p on p.id = v.package_id join course_details cd on cd.assortment_id = p.assortment_id where pis.student_id = ? and pis.is_active = 1 and pis.is_otp_verified = 1 limit 1';
        return database.query(sql, [studentId]);
    }

    static getEnrolledStudentsInCourse(db, assortmentId) { // * 20ms
        const sql = 'select count(*) as count from student_package_subscription sps where new_package_id in (select id from package where assortment_id=?) and is_active=1 and amount>-1';
        return db.query(sql, [assortmentId]);
    }

    static getCourseID(db, assortmentId) { // * 20ms
        const sql = 'select liveclass_course_id from course_details_liveclass_course_mapping where assortment_id = ?';
        return db.query(sql, [assortmentId]);
    }

    static getSubjectsListByCourseAssortmentRecommendationWidget(db, assortmentID) { // 120 ms
        let sql = '';
        if (+assortmentID === 15 || +assortmentID === 16) {
            sql = 'select * from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id =?) ) as a inner join (select * from course_details where display_name<>\'ALL\' and display_name<>\'QUIZ\' and display_name <> \'INTRODUCTION\' and display_name <> \'GUIDANCE\' and is_active = 1 and (parent not in (2, 3) or parent is null)) as b on b.assortment_id=a.course_resource_id group by b.assortment_id';
            return db.query(sql, [assortmentID]);
        }
        sql = 'select * from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id =? ) as a inner join (select * from course_details where display_name<>\'ALL\' and display_name<>\'QUIZ\' and display_name <> \'INTRODUCTION\' and display_name <> \'ANNOUNCEMENT\' and display_name <> \'WEEKLY TEST\' and display_name <> \'GUIDANCE\' and is_active = 1 and (parent not in (2, 3) or parent is null)) as b on b.assortment_id=a.course_resource_id group by b.assortment_id';
        return db.query(sql, [assortmentID]);
    }

    static getStudentScoreWeekly(db, assortmentID, studentID, dateWeekly) { // *30ms
        const sql = 'select * from testseries_student_reportcards where test_id in (select test_id from testseries where course_id = ? and is_active = 1) and student_id = ? and created_at > ?';
        return db.query(sql, [assortmentID, studentID, dateWeekly]);
    }

    static getStudentScoreMonthly(db, assortmentID, studentID, dateMonthly) { // *25ms
        const sql = 'select * from testseries_student_reportcards where test_id in (select test_id from testseries where course_id = ? and is_active = 1) and student_id = ? and created_at > ?';
        return db.query(sql, [assortmentID, studentID, dateMonthly]);
    }

    static getStudentScoreAll(db, assortmentID, studentID) { // *20ms
        const sql = 'select * from testseries_student_reportcards where test_id in (select test_id from testseries where course_id = ? and is_active = 1) and student_id = ?';
        return db.query(sql, [assortmentID, studentID]);
    }

    static getTestScore(db, testId, studentID) { // *20ms
        const sql = 'select * from testseries_student_reportcards where test_id = ? and student_id = ?';
        return db.query(sql, [testId, studentID]);
    }

    static getTestsByCourseId(db, assortment) { // 45ms
        const sql = 'select * from testseries where course_id = ?';
        return db.query(sql, [assortment]);
    }

    static getOfferAds(db, studentClass) { // 30 ms
        const sql = 'select * from (select * from course_ads where target_class=? and is_active=1 and ad_type in (\'QID_offer\') and (ads_endtime is null or ads_endtime > CURRENT_TIMESTAMP)) as a left join answers as b on a.ad_qId=b.question_id left join (select * from answer_video_resources where resource_type=\'BLOB\') as c on b.answer_id=c.answer_id';
        return db.query(sql, [studentClass]);
    }

    static getSampleTestForAssortment(db, assortmentID, studentID) { // 30 ms
        const sql = 'select * from (select resource_reference as test_id,topic as test_title from course_sample_pdf ct where resource_type=9 and assortment_id=?) as csp left join (select no_of_questions,test_id, duration_in_min from testseries) as ts on ts.test_id=csp.test_id left join (select test_id as s_test_id, student_id, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.s_test_id=csp.test_id';
        return db.query(sql, [assortmentID, studentID]);
    }

    static getSubjectList(database, ecmId, studentClass) {
        const sql = `select DISTINCT(subject) from (select subject,ecm_id from etoos_chapter where ecm_id =${ecmId})as a left join  etoos_course_mapping as b on a.ecm_id=b.id and b.class=${studentClass};`;
        console.log(sql);
        return database.query(sql);
    }

    static setStickyNotification(db, studentID, assortmentID) { // 40ms
        const sql = 'INSERT IGNORE INTO recommendation_sticky_notification (student_id, assortment_id) VALUES ( ?, ?)';
        return db.query(sql, [studentID, assortmentID]);
    }

    static getScholarshipAppStripBanner(db, testId, locale, progress) { // * 20ms
        const sql = 'select * from scholarship_banners where test_id = ? and type=\'explore_strip\' and locale=? and progress_id=? and is_active = 1';
        return db.query(sql, [testId, locale, progress]);
    }

    static getTopperBanners(db) { // * 20ms
        const sql = 'select * from home_banner where type=\'short_banner\' and is_active=1';
        return db.query(sql);
    }

    static getTopperTestimonial(db, studentClass, meta) { // * 20ms
        const sql = 'select * from course_reviews where topper=1 and is_active=1 and (review_class=? or review_class is null) and review_meta=? group by review_id order by review_order';
        return db.query(sql, [studentClass, meta]);
    }

    static getTestSeriesAssortments(db, categories, studentClass, metaInfo) { // * 20ms
        const sql = 'select * from course_details where category in (?) and is_active=1 and meta_info=? and class=? and assortment_type="course" and sub_assortment_type="mock_test" order by assortment_id desc';
        return db.query(sql, [categories, metaInfo, studentClass]);
    }

    static getScholarshipExamsOld(db, type) { // * 50-60ms
        const sql = 'select * from scholarship_exam where type in (?) and is_active = 0';
        return db.query(sql, [type]);
    }

    static getScholarshipLeaderByTestSmall(db, testId) { // * 30 ms
        const sql = 'select a.test_id,a.rank,a.discount_percent,a.marks,a.student_id,a.use_name,b.img_url,b.student_fname,b.student_lname,b.mobile from scholarship_test as a inner join students as b on a.student_id=b.student_id where a.test_id in (?) and a.rank is not null order by cast(a.rank as unsigned) asc limit 3';
        return db.query(sql, [testId]);
    }

    static getCourseTargetGroupsForThumbnailTags(db, assortmentID) { // * 50ms
        const sql = 'SELECT * from course_tags where assortment_id in (?) and type = \'thumbnail_tag\' and is_active = 1 and start_date <= now() and end_date >= now()';
        return db.query(sql, [assortmentID]);
    }

    static getResourcesByChapterName(db, topic, studentClass, resourceTypes, free) { // * 50ms
        const sql = 'SELECT * from (SELECT * from course_resources where topic in (?) and resource_type in (?)) as cr left join (select assortment_id,course_resource_id from course_resource_mapping where resource_type="resource") as crm on crm.course_resource_id=cr.id and crm.course_resource_id is not null left join (select assortment_id,is_free from course_details where is_free=?) as cd on cd.assortment_id=crm.assortment_id left join (select degree, id from dashboard_users) as du on du.id=cr.faculty_id where cd.assortment_id is not null and class=? group by cr.resource_reference';
        return db.query(sql, [topic, resourceTypes, free, studentClass]);
    }

    static getLatestPdfsByClass(db, studentClass) { // * 80ms
        const sql = 'SELECT * from (SELECT * from course_resources where class=? and resource_type=2) as cr left join (select assortment_id,course_resource_id from course_resource_mapping where resource_type="resource") as crm on crm.course_resource_id=cr.id and crm.course_resource_id is not null left join (select assortment_id,is_free from course_details where is_free=0 and assortment_type="resource_pdf") as cd on cd.assortment_id=crm.assortment_id left join (select degree, id from dashboard_users) as du on du.id=cr.faculty_id where cd.assortment_id is not null group by cd.assortment_id order by cr.id desc limit 10';
        return db.query(sql, [studentClass]);
    }

    static getCourseListByClass(db, studentClass, locale) {
        let sql = '';
        if (locale === 'hi') {
            sql = 'select cd.*, v.id as variant_id, v.display_price, p.min_limit, p.batch_id, cdlcm.liveclass_course_id from (select * from course_details where class=? and assortment_type=\'course\' and meta_info="HINDI" and parent<>4 and is_active = 1) as cd inner join (select assortment_id, id,min_limit, batch_id from package where type=\'subscription\' and is_active=1 and reference_type=\'v3\' and duration_in_days=30) as p on p.assortment_id=cd.assortment_id inner join (select id, package_id,display_price from variants where is_default=1 and is_show=1) as v on v.package_id=p.id left join (select liveclass_course_id, assortment_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by cd.created_at limit 20';
            return db.query(sql, [studentClass, locale]);
        }
        sql = 'select cd.*, v.id as variant_id, v.display_price, p.min_limit, p.batch_id, cdlcm.liveclass_course_id from (select * from course_details where class=? and assortment_type=\'course\' and meta_info="ENGLISH" and parent<>4 and is_active = 1) as cd inner join (select assortment_id, id,min_limit, batch_id from package where type=\'subscription\' and is_active=1 and reference_type=\'v3\' and duration_in_days=30) as p on p.assortment_id=cd.assortment_id inner join (select id, package_id,display_price from variants where is_default=1 and is_show=1) as v on v.package_id=p.id left join (select liveclass_course_id, assortment_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id order by cd.created_at limit 20';
        return db.query(sql, [studentClass, locale]);
    }

    static getBatchDetailsByAssortment(db, assortmentId, batchId) {
        const sql = 'select assortment_id, batch_id, batch_start_date as start_date, batch_end_date as end_date, demo_video_qid, display_name, display_description from course_assortment_batch_mapping where assortment_id = ? and batch_id = ?';
        return db.query(sql, [assortmentId, batchId]);
    }

    static getPackagesOfAssortmentsByDuration(db, assortmentIds, duration) {
        const sql = 'select * from package where assortment_id in (?) and duration_in_days=? and is_active=1 and reference_type="v3"';
        return db.query(sql, [assortmentIds, duration]);
    }

    static getPackageNameFromId(db, packageNumber) { // * 30ms
        const sql = 'select student_id,package from studentid_package_mapping_new where student_id in (?)';
        return db.query(sql, [packageNumber]);
    }

    static getCourseDetailsForHomepageWithThumbnailsByCategory(database, assortmentList, widgetType, versionCode) { // * 40ms
        const sql = 'select * from (select * from course_details cd where cd.assortment_type=\'course\' and cd.is_active=1 and is_free=0 and parent<>4 and cd.assortment_id in (?)) as a inner join (select *,image_url as image_thumbnail, assortment_id as course_thumbnail_assortment_id from course_details_thumbnails) as b on a.assortment_id = b.course_thumbnail_assortment_id where b.is_active = 1 and b.type = ? and b.min_version_code <= ? and b.max_version_code >= ? group by a.assortment_id order by a.created_at desc';
        return database.query(sql, [assortmentList, widgetType, versionCode, versionCode]);
    }

    static getEnglishSubjectAssortmentsOfCourse(database, assortmentId) { // * 40ms
        const sql = 'select * from (select assortment_id from course_resource_mapping where course_resource_id=? and resource_type=\'assortment\') as crm1 left join (select course_resource_id, assortment_id from course_resource_mapping where resource_type=\'assortment\') as crm2 on crm2.assortment_id =crm1.assortment_id left join (select display_name,assortment_id from course_details where is_active=1) as cd on cd.assortment_id=crm2.course_resource_id where cd.display_name like \'english%\' and cd.assortment_id <> ? group by cd.assortment_id';
        return database.query(sql, [assortmentId, assortmentId]);
    }

    static getQuizResponseByResourceReference(database, resourceReference, studentId, quizQuestionId) { // * 40ms
        const sql = "select * from liveclass_quiz_response where resource_reference = ? and student_id = ? and quiz_question_id=? and created_at >= CONCAT(date(NOW()),' 00:00:00') AND created_at <= CONCAT(date(NOW()),' 23:59:59')";
        return database.query(sql, [resourceReference, studentId, quizQuestionId]);
    }

    static getAssortmentMapping(database, resourceReference) { // * 40ms
        const sql = 'select case when assortment_id in (1,159774) then 159774 when assortment_id in (3,159775) then 159775 when assortment_id in (6,165055) then 165055 when assortment_id in (8,165056) then 165056 when assortment_id in (2,165057) then 165057 when assortment_id in (4,165058) then 165058 when assortment_id in (5,159772) then 159772 when assortment_id in (7,159773) then 159773 when assortment_id in (21,165053) then 165053 when assortment_id in (19,165051) then 165051 when assortment_id in (26,165052) then 165052 when assortment_id in (18,165049) then 165049 when assortment_id in (25,165050) then 165050 when assortment_id in (29,330519) then 330519 when assortment_id in (91153,330515) then 330515 when assortment_id in (77589,330521) then 330521 when assortment_id in (91151,330517) then 330517 when assortment_id in (30,330518) then 330518 when assortment_id in (91154,330514) then 330514 when assortment_id in (17929,330520) then 330520 when assortment_id in (91152,330516) then 330516 else assortment_id end as assortment_id from (select distinct(a.liveclass_course_id) from (select * from liveclass_course_resources where resource_reference=?) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id) as a left join (select * from course_details_liveclass_course_mapping where vendor_id = 1 and is_free = 1 and assortment_id not in (9)) as b on a.liveclass_course_id=b.liveclass_course_id   group by b.assortment_id';
        return database.query(sql, [resourceReference.toString()]);
    }

    static getLatestLauncedCourses(database, studentClass, locale) { // * 40ms
        const sql = `select cd.*,cabm.*, cdlcm.liveclass_course_id, max(batch_start_date) from (select * from course_details cd where is_active=1 and class=? and is_free=0 and assortment_type in ("course", "course_bundle") and ccm_id=0 ) as cd left join (select assortment_id as batch_table_assortment_id, batch_start_date, display_name, demo_video_thumbnail from course_assortment_batch_mapping where is_active=1) as cabm on cabm.batch_table_assortment_id=cd.assortment_id left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id=cd.assortment_id GROUP by cd.assortment_id order by cd.meta_info ${locale === 'hi' ? 'desc' : ''}, batch_start_date desc`;
        return database.query(sql, [studentClass]);
    }

    static getScholarshipWebBanner(db, testId, progress, locale) { // * 20ms
        const sql = 'select * from scholarship_banners where test_id = ? and type=\'web_banner\' and locale=? and progress_id=? and is_active = 1';
        return db.query(sql, [testId, locale, progress]);
    }

    static getFreeSubjectsForExplore(database, studentClass, locale, categoryType) { // 60ms
        let sql = '';
        const language = locale && locale === 'hi' ? 'HINDI' : 'ENGLISH';
        if (+studentClass === 14) {
            sql = 'select * FROM ( select assortment_id from course_details where class=? and is_active=1 and assortment_type="course" and is_free=1 and category_type = ? and assortment_id in (159772,159773,159774,159775,165049,165050,165051,165052,165053,165054,165055,165056,165057,165058,330514,330515,330516,330517,330518,330519,330520,330521,23,31,324960,324961,344177) ORDER by year_exam desc limit 1 ) as cd1 left join ( select course_resource_id,assortment_id from course_resource_mapping crm ) as crm on crm.assortment_id=cd1.assortment_id inner join ( select * from course_details where display_name not in ("ALL", "WEEKLY TEST", "GUIDANCE", "QUIZ", "ANNOUNCEMENT") ) as cd2 on cd2.assortment_id=crm.course_resource_id GROUP by cd2.assortment_id';
            return database.query(sql, [studentClass, categoryType]);
        }
        sql = 'select * FROM ( select assortment_id from course_details where class=? and is_active=1 and assortment_type="course" and is_free=1 and category_type=? and assortment_id in (159772,159773,159774,159775,165049,165050,165051,165052,165053,165054,165055,165056,165057,165058,330514,330515,330516,330517,330518,330519,330520,330521,23,31,324960,324961,344177) and meta_info=? ORDER by year_exam desc limit 1 ) as cd1 left join ( select course_resource_id,assortment_id from course_resource_mapping crm ) as crm on crm.assortment_id=cd1.assortment_id inner join ( select * from course_details where display_name not in ("ALL", "WEEKLY TEST", "GUIDANCE", "QUIZ", "ANNOUNCEMENT") ) as cd2 on cd2.assortment_id=crm.course_resource_id GROUP by cd2.assortment_id';
        return database.query(sql, [studentClass, categoryType, language]);
    }

    static getStudentLocation(db, studentID) { // * 20ms
        const sql = 'select * from user_city_state_mapping where student_id = ?';
        return db.query(sql, [studentID]);
    }

    static checkUserQuizReward(db, studentID) { // * 20ms
        const sql = 'select * from quiztfs_rewards where student_id = ? and is_active=1 and is_redeemed=0 and valid_till >= CURRENT_DATE';
        return db.query(sql, [studentID]);
    }

    static getChapterRelatedVideosFromResourceID(database, questionID) {
        const sql = 'SELECT crm6.assortment_id as course_assortment_id, cd.is_active,cd.is_free,crm5.assortment_id as subject_assortment_id,crm2.assortment_id as chapter_assortment_id,cr2.id,cr2.resource_reference,cr2.name as display,cr2.topic,cr2.subject,d.image_url as faculty_image, cr2.expert_name, cr2.stream_status,crm4.batch_id, crm4.live_at, cr2.chapter_order from (SELECT * from course_resources where resource_reference = ? and resource_type in (1,4,8)) as cr left join course_resource_mapping as crm1 on cr.id=crm1.course_resource_id and crm1.resource_type=\'resource\' left join course_resource_mapping as crm2 on crm1.assortment_id = crm2.course_resource_id and crm2.resource_type=\'assortment\' left join course_resource_mapping crm3 on crm2.assortment_id = crm3.assortment_id and crm3.resource_type=\'assortment\' left join course_resource_mapping as crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type=\'resource\' left join course_resources as cr2 on crm4.course_resource_id=cr2.id left join course_resource_mapping crm5 on crm2.assortment_id=crm5.course_resource_id and crm5.resource_type = \'assortment\' left join course_resource_mapping crm6 on crm6.course_resource_id=crm5.assortment_id and crm6.resource_type = \'assortment\' left join course_details cd on cd.assortment_id=crm6.assortment_id left join dashboard_users d on cr2.faculty_id = d.id where cr2.resource_type in (1,8) group by cr2.resource_reference,crm4.batch_id,course_assortment_id order by crm4.live_at';
        return database.query(sql, [questionID]);
    }

    static getNextChapterOfSubject(database, subjectAssortmentID, chapterAssortment) {
        const sql = 'select * from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' and course_resource_id > ? limit 1';
        return database.query(sql, [subjectAssortmentID, chapterAssortment]);
    }

    static getPrevChapterOfSubject(database, subjectAssortmentID, chapterAssortment) {
        const sql = 'select * from course_resource_mapping where assortment_id=? and resource_type=\'assortment\' and course_resource_id < ? limit 1';
        return database.query(sql, [subjectAssortmentID, chapterAssortment]);
    }

    static getSamplePapersOfCourse(db, assortmentID, batchID, subject, offset) {
        let sql = '';
        if (subject) {
            sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Sample paper\' and cr.subject=? and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
            return db.query(sql, [assortmentID, batchID, subject, offset]);
        }
        sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Sample paper\' and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
        return db.query(sql, [assortmentID, batchID, offset]);
    }

    static getImpQuestionsSubjectiveOfCourse(db, assortmentID, batchID, subject, offset) {
        let sql = '';
        if (subject) {
            sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Important questions subjective\' and cr.subject=? and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
            return db.query(sql, [assortmentID, batchID, subject, offset]);
        }
        sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Important questions subjective\' and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
        return db.query(sql, [assortmentID, batchID, offset]);
    }

    static getImpQuestionsObjectiveOfCourse(db, assortmentID, batchID, subject, offset) {
        let sql = '';
        if (subject) {
            sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Important questions objective\' and cr.subject=? and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
            return db.query(sql, [assortmentID, batchID, subject, offset]);
        }
        sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type = 2 and cr.meta_info=\'Revision-Important questions objective\' and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
        return db.query(sql, [assortmentID, batchID, offset]);
    }

    static getOneShotClassesOfCourse(db, assortmentID, batchID, subject, offset, type) {
        let sql = '';
        if (subject) {
            sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type in (1,8) and cr.lecture_type=? and cr.subject=? and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
            return db.query(sql, [assortmentID, batchID, type, subject, offset]);
        }
        sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id =? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type in (1,8) and cr.lecture_type=? and d.live_at <CURRENT_TIMESTAMP limit 10 offset ?';
        return db.query(sql, [assortmentID, batchID, type, offset]);
    }

    static getRevisionMockTestOfCourses(db, assortmentID, studentID, batchID, subject, offset) {
        let sql = '';
        if (subject) {
            sql = 'SELECT cr.*,ts.*,tss.completion_status from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id  left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=cr.resource_reference and cr.resource_type = 9 left join (SELECT test_id, student_id, max(case when status is null then 0 when status = \'COMPLETED\' then 0 else 1 end)as completion_status, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.test_id=ts.test_id where cr.resource_type = 9 and cr.meta_info = \'Revision-mock test\' and cr.subject=? and d.live_at <CURRENT_TIMESTAMP and (tss.completion_status=0 or tss.completion_status is null or tss.completion_status<>\'COMPLETED\') limit 10 offset ?';
            return db.query(sql, [assortmentID, batchID, studentID, subject, offset]);
        }
        sql = 'SELECT cr.*,ts.*,tss.completion_status from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id  left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=cr.resource_reference and cr.resource_type = 9 left join (SELECT test_id, student_id, max(case when status is null then 0 when status = \'COMPLETED\' then 0 else 1 end)as completion_status, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.test_id=ts.test_id where cr.resource_type = 9 and cr.meta_info = \'Revision-mock test\' and d.live_at <CURRENT_TIMESTAMP and (tss.completion_status=0 or tss.completion_status is null or tss.completion_status<>\'COMPLETED\') limit 10 offset ?';
        return db.query(sql, [assortmentID, batchID, studentID, offset]);
    }

    static getRevisionChapterTestOfCourses(db, assortmentID, studentID, batchID, subject, offset) {
        let sql = '';
        if (subject) {
            sql = 'SELECT cr.*,ts.*,tss.completion_status from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id  left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=cr.resource_reference and cr.resource_type = 9 left join (SELECT test_id, student_id, max(case when status is null then 0 when status = \'COMPLETED\' then 0 else 1 end)as completion_status, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.test_id=ts.test_id where cr.resource_type = 9 and cr.meta_info = \'Revision-chapter test\' and cr.subject=? and d.live_at <CURRENT_TIMESTAMP and (tss.completion_status=0 or tss.completion_status is null or tss.completion_status<>\'COMPLETED\') limit 10 offset ? ';
            return db.query(sql, [assortmentID, batchID, studentID, subject, offset]);
        }
        sql = 'SELECT cr.*,ts.*,tss.completion_status from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id  left join (select duration_in_min,no_of_questions,test_id, title as test_title from testseries) as ts on ts.test_id=cr.resource_reference and cr.resource_type = 9 left join (SELECT test_id, student_id, max(case when status is null then 0 when status = \'COMPLETED\' then 0 else 1 end)as completion_status, max(completed_at) as completed_at FROM testseries_student_subscriptions WHERE student_id = ? group by test_id,student_id) as tss on tss.test_id=ts.test_id where cr.resource_type = 9 and cr.meta_info = \'Revision-chapter test\' and d.live_at <CURRENT_TIMESTAMP and (tss.completion_status=0 or tss.completion_status is null or tss.completion_status<>\'COMPLETED\') limit 10 offset ? ';
        return db.query(sql, [assortmentID, batchID, studentID, offset]);
    }

    static getCoursesAndSubjectsOfClassForBoards(db, studentClass) {
        const sql = 'SELECT * from course_details where assortment_type="course" and is_active=1 and class=? and category_type="BOARDS/SCHOOL/TUITION" and is_free=0 and ccm_id=1 UNION SELECT * from course_details where assortment_type="subject" and is_active=1 and category_type="BOARDS/SCHOOL/TUITION" and is_free=0 and assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (SELECT assortment_id from course_details where assortment_type="course" and is_active=1 and class=? and category_type="BOARDS/SCHOOL/TUITION" and is_free=0 and is_active_sales=1 and ccm_id=1) and demo_video_thumbnail is not null) order by assortment_type, created_at desc';
        return db.query(sql, [studentClass, studentClass]);
    }

    static getCoursesAndSubjectsOfClassForEntranceExams(db, studentClass) {
        let sql = '';
        if (+studentClass === 14) {
            sql = 'SELECT * from course_details where assortment_type="course" and is_active=1 and class=14 and is_free=0 and ccm_id=1';
            return db.query(sql, [studentClass, studentClass]);
        }
        sql = 'SELECT * from course_details where assortment_type="course" and is_active=1 and class=? and category_type in ("IIT JEE", "NEET") and is_free=0 and (parent<>4 or parent is null) and sub_assortment_type is NULL UNION SELECT * from course_details where assortment_id=138829 and class=? and is_active = 1 order by created_at desc';
        return db.query(sql, [studentClass, studentClass]);
    }

    static getRevisionContentOfCourse(db, assortmentID, batchID) {
        const sql = 'SELECT cr.id from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id =? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type= \'assortment\' left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type=\'resource\' and d.batch_id=? and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type in (1,8,2,9) and cr.meta_info like \'Revision%\' and d.live_at <CURRENT_TIMESTAMP limit 10';
        return db.query(sql, [assortmentID, batchID]);
    }

    static getInterviewData(db, studentId, testId) { // * 20ms
        const sql = 'select * from interview where student_id = ? and test_id = ?';
        return db.query(sql, [studentId, testId]);
    }

    static getUserSubscribedqIds(db, studentID, qIds) { // * 20ms
        const sql = 'select is_interested,resource_reference from liveclass_subscribers where student_id = ? and resource_reference in (?)';
        return db.query(sql, [studentID, qIds]);
    }

    static getStudentRegistrationByTestIds(database, studentId, testId) {
        const sql = 'select * from scholarship_test where student_id=? and test_id in (?)';
        return database.query(sql, [studentId, testId]);
    }

    static getLastDNST(db) { // * 20-30ms
        const sql = 'select * from scholarship_exam where type like \'DNST%\' and is_active = 0 order by id desc limit 1';
        return db.query(sql);
    }

    static getCoursesClassCourseMappingWithCategory(database, studentId) {
        const sql = 'select a.course, a.id, a.category as ccm_category from class_course_mapping a left join student_course_mapping b on a.id = b.ccm_id where b.student_id=? order by a.category desc, a.priority asc';
        return database.query(sql, [studentId]);
    }

    static getRenewalDuePackages(database, studentId) {
        const sql = 'select student_id from student_package_subscription where ((end_date <= now() and end_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)) OR (end_date >= now() and end_date <= DATE_ADD(NOW(), INTERVAL 8 DAY) and is_active=1))  and amount > -1 and start_date < now()and student_id=?';
        return database.query(sql, [studentId]);
    }

    static getPdfDetailById(database, resourceId) {
        const sql = 'select * from course_resources where id=? and resource_type=2';
        return database.query(sql, [resourceId]);
    }

    static updatePdfDownloadStats(database, studentID, resourceId, count) {
        const sql = 'update pdf_download_stats set count = ? where student_id = ? and resource_id = ?';
        return database.query(sql, [count, studentID, resourceId]);
    }

    static getFormulaSheet(database, chapterName, studentClass) {
        let sql = '';
        if (studentClass) {
            sql = 'SELECT name,resource_type,resource_path,student_class FROM new_library WHERE name LIKE ? AND resource_type ="pdf" and student_class= ? limit 1';
            return database.query(sql, [chapterName, studentClass]);
        }
        sql = 'SELECT name,resource_type,resource_path,student_class FROM new_library WHERE name LIKE ? AND resource_type ="pdf" limit 1';
        return database.query(sql, [chapterName]);
    }

    static getBooksData(database, chapterName, studentClass, subject) {
        let sql = '';
        if (studentClass) {
            sql = 'SELECT DISTINCT(spd.package), a.chapter, spd.id, spd.student_id, spd.thumbnail_url, spd.class, spd.subject, spd.original_book_name FROM chapter_pdf_details as a join studentid_package_details spd on a.student_id= spd.student_id where spd.is_active=1 and spd.subject=? and spd.class=? and a.chapter=? and spd.package_type in (\'books\',\'ncert\',\'coaching\') limit 5';
            return database.query(sql, [subject, studentClass, chapterName]);
        }
        sql = 'SELECT DISTINCT(spd.package), a.chapter, spd.id, spd.student_id, spd.thumbnail_url, spd.class, spd.subject, spd.original_book_name FROM chapter_pdf_details as a join studentid_package_details spd on a.student_id= spd.student_id where spd.is_active=1 and spd.subject=? and a.chapter=? and spd.package_type in (\'books\',\'ncert\',\'coaching\') limit 5';
        return database.query(sql, [subject, chapterName]);
    }

    static getBookMarkedResourcesOfStudent(database, studentId, assortmentId) {
        const sql = 'select * from student_bookmarked_resources where student_id=? and is_bookmarked=1 and course_assortment_id=? limit 5';
        return database.query(sql, [studentId, assortmentId]);
    }

    static getBookMarkedDoubtsOfStudent(database, studentId, assortmentId, offset) {
        const sql = 'select *, max(updated_at) from (select is_bookmarked, course_resource_id, updated_at from student_bookmarked_resources where student_id=? and is_bookmarked=1 and course_assortment_id=? and is_doubt=1) as sbr inner join (select chapter, id from course_resources) as cr on cr.id=sbr.course_resource_id group by cr.chapter order by sbr.updated_at desc limit 10 offset ?';
        return database.query(sql, [studentId, assortmentId, offset]);
    }

    static getBookMarkedDoubtsByChapterNames(database, chapterList, studentId, assortmentId) {
        const sql = 'select * from (select chapter,subject,id from course_resources where chapter in (?)) as cr inner join (select is_bookmarked, updated_at, course_resource_id, comment_id from student_bookmarked_resources where student_id=? and is_bookmarked=1 and course_assortment_id=? and is_doubt=1) as sbr on cr.id=sbr.course_resource_id order by sbr.updated_at desc';
        return database.query(sql, [chapterList, studentId, assortmentId]);
    }

    static getBookMarkedResourcesOfStudentByResouceType(database, studentId, assortmentId, resourceTypes, batchID, offset) {
        const sql = 'select *, 1 as is_free from (select is_bookmarked, course_resource_id from student_bookmarked_resources where student_id=? and is_bookmarked=1 and course_assortment_id=? and is_doubt=0) as sbr inner join (select * from course_resources where resource_type in (?)) as cr on cr.id=sbr.course_resource_id inner join (select course_resource_id, live_at, assortment_id, batch_id from course_resource_mapping where resource_type=\'RESOURCE\') as crm on cr.id=crm.course_resource_id and crm.batch_id=? group by cr.resource_reference,crm.batch_id limit 10 offset ?';
        return database.query(sql, [studentId, assortmentId, resourceTypes, batchID, offset]);
    }

    static getDataFromResourceId(database, resourceList, resourceTypes, batchID, offset) {
        const sql = 'select a.*,b.live_at,b.assortment_id, 1 as is_free from (select * from course_resources where id in (?)) as a inner join (select course_resource_id, resource_type, live_at, assortment_id, batch_id from course_resource_mapping) as b on a.id=b.course_resource_id and b.resource_type=\'RESOURCE\' and b.batch_id=? and a.resource_type in (?) group by a.id, batch_id limit 10 offset ?';
        return database.query(sql, [resourceList, batchID, resourceTypes, offset]);
    }

    static setBookmarkedResource(database, studentId, resourceId, assortmentId, bookmark, isDoubt) {
        let sql;
        if (isDoubt) {
            sql = 'update student_bookmarked_resources set is_bookmarked=? where student_id=? and comment_id=? and course_assortment_id=?';
            return database.query(sql, [bookmark, studentId, resourceId, assortmentId]);
        }
        sql = 'update student_bookmarked_resources set is_bookmarked=? where student_id=? and course_resource_id=? and course_assortment_id=?';
        return database.query(sql, [bookmark, studentId, resourceId, assortmentId]);
    }

    static bookmarkCourseResource(database, data) {
        const sql = 'insert into student_bookmarked_resources set ?';
        return database.query(sql, [data]);
    }

    static getBookMarkedResourcesByResourceId(database, studentId, resourceId, isDoubt = 0) {
        let sql = null;
        if (isDoubt) {
            sql = 'select * from student_bookmarked_resources where student_id=? and comment_id in (?) and is_doubt=1 and is_bookmarked=1';
            return database.query(sql, [studentId, resourceId]);
        }
        sql = 'select * from student_bookmarked_resources where student_id=? and course_resource_id in (?) and is_doubt=0 and is_bookmarked=1';
        return database.query(sql, [studentId, resourceId]);
    }

    static getAllBookMarkedResourcesByResourceId(database, studentId, resourceId, assortmentId, isDoubt = 0) {
        let sql = null;
        if (isDoubt) {
            sql = 'select * from student_bookmarked_resources where student_id=? and comment_id=? and is_doubt=1 and course_assortment_id=?';
            return database.query(sql, [studentId, resourceId, assortmentId]);
        }
        sql = 'select * from student_bookmarked_resources where student_id=? and course_resource_id=? and is_doubt=0 and course_assortment_id=?';
        return database.query(sql, [studentId, resourceId, assortmentId]);
    }

    static getChildCoursesOfBundleAssortment(database, assortmentId) {
        const sql = 'select *,v.id as vid from (select course_resource_id, batch_id as crm_batch_id from course_resource_mapping where assortment_id=? and resource_type=\'assortment\') as crm left join (select assortment_id,start_date, assortment_type,category,class from course_details) as c on c.assortment_id=crm.course_resource_id left join package as p on crm.course_resource_id=p.assortment_id left join variants as v on v.package_id=p.id where c.assortment_id is not null and p.batch_id = crm.crm_batch_id and c.assortment_type = "course" GROUP by course_resource_id';
        return database.query(sql, [assortmentId]);
    }

    static getParentPlaylistId(db, studentClass, studentLocaleTemp, ccmIdList) { // 30 ms
        let sql;
        if (ccmIdList) {
            sql = 'select playlist_id from library_playlists_ccm_mapping where class = ? and locale = ? and ccm_id in (?) and flag_id is null';
            return db.query(sql, [studentClass, studentLocaleTemp, ccmIdList]);
        }
        sql = 'select playlist_id from library_playlists_ccm_mapping where class = ? and locale = ? and ccm_id is null and flag_id is null';
        return db.query(sql, [studentClass, studentLocaleTemp]);
    }

    static getTopTeachersQueryByPlaylist(db, playlistId) {
        const sql = 'select resource_path from new_library where id = ? and is_last = 1';
        return db.query(sql, [playlistId]);
    }

    static getTopTeachersAllVideosByQuery(db, getQuery) {
        return db.query(getQuery);
    }

    static getCoursePageIconsDetail(db, iconsList) {
        const sql = 'select *, title as title_hindi from course_detail_page_cards where id in (?) and is_active =1';
        return db.query(sql, [iconsList]);
    }

    static getFreeLiveClassCaraousel(db, stClass, locale, versionCode, page, limit) { // 12-20ms
        const offset = (page - 1) * limit;
        const sql = 'SELECT * FROM course_carousel WHERE class= ? and locale=? and is_active = 1 and  min_version_code<= ? and max_version_code>=? and category="free_classes" ORDER by carousel_order limit ? offset ?';
        return db.query(sql, [stClass, locale, versionCode, versionCode, limit, offset]);
    }

    static getFreeAssortmentListData(db, stClass, category, locale) { // * 10-30ms
        let sql = 'SELECT assortment_id FROM `course_details` WHERE class = ? and is_free =1 and is_active=1 and assortment_type="course"';
        sql = locale ? `${sql} and meta_info='${locale}'` : sql;
        sql = category ? `${sql} and category='${category}'` : sql;
        return db.query(sql, [stClass]);
    }

    static getLiveClassVideoDataChapterWise(db, assortmentList) { // * 30-40ms
        // const sql = 'select * from (select b.assortment_id as chapter_assortment_id,d.*,count(d.resource_reference) as no_of_lecture from (select * from course_resource_mapping where assortment_id in (?) and  resource_type="assortment") as a left join (select * from course_resource_mapping where resource_type="assortment") as b on a.course_resource_id=b.assortment_id left join (select * from course_resource_mapping where resource_type="resource") as c on b.course_resource_id=c.assortment_id inner join (select * from course_resources where resource_type in (1,4,8)) as d on c.course_resource_id=d.id GROUP by b.assortment_id,d.chapter,d.resource_reference order by c.live_at) as e GROUP by e.topic';
        const sql = 'select b.assortment_id as chapter_assortment_id,d.*,count(d.resource_reference) as no_of_lecture from (select * from course_resource_mapping where assortment_id in (?) and  resource_type="assortment") as a left join (select * from course_resource_mapping where resource_type="assortment") as b on a.course_resource_id=b.assortment_id left join (select * from course_resource_mapping where resource_type="resource" and is_replay=0) as c on b.course_resource_id=c.assortment_id inner join (select * from course_resources where resource_type in (1,8)) as d on c.course_resource_id=d.id GROUP by b.assortment_id order by c.live_at';
        return db.query(sql, [assortmentList]);
    }

    static getLiveClassTeachersLatestVideoSql(db, facultyId) { // * 5-10ms
        const sql = 'SELECT resource_reference,faculty_id FROM course_resources where faculty_id=? and resource_type in (1,4,8) order by id desc limit 1';
        return db.query(sql, [facultyId]);
    }

    static updateCourseResources(database, obj, resourceId) {
        const sql = 'update course_resources set ? where id=?';
        return database.query(sql, [obj, resourceId]);
    }

    static getpurchaseCountByAssortment(db, assortmentId, dateValue) { // * 20ms
        const sql = 'select count(*) as count from student_package_subscription sps where new_package_id in (select id from package where assortment_id=?) and created_at >= ?';
        return db.query(sql, [assortmentId, dateValue]);
    }

    static getFacultyPriorityByClassAndLocale(db, studentClass, locale) { // * 20ms
        const sql = 'select * from categorywise_faculty_ordering where class=? and locale=?';
        return db.query(sql, [studentClass, locale]);
    }

    static getSubjectAssortmentByQid(database, resourceReference) {
        const sql = 'select distinct(b.assortment_id), d.assortment_id as chapter_assortment, e.assortment_id as subject_assortment_id, c.is_free, c.parent, cd.is_free as is_chapter_free, a.*,cd.class from (select id, subject, expert_image, expert_name, display,chapter, faculty_id from course_resources where resource_reference=? and resource_type in (1,4,8)) as a inner join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type="resource") as b on a.id=b.course_resource_id left join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type="assortment") as d on b.assortment_id=d.course_resource_id left join (select assortment_id, course_resource_id, resource_type  from course_resource_mapping where resource_type="assortment") as e on d.assortment_id=e.course_resource_id left join (select * from course_details) as c on c.assortment_id=b.assortment_id left join (select assortment_id,is_free,class from course_details) as cd on cd.assortment_id=d.assortment_id';
        // console.log(sql);
        return database.query(sql, [`${resourceReference}`]);
    }

    static getPracticeEnglishBottomSheetData(database) {
        const sql = 'select * from dn_property where bucket=\'quiztfs\' and name like \'%bottomsheet%\' order by priority';
        return database.query(sql);
    }

    static getAllChildAssortments(database, assortmentIDArray) {
        // 11 ms
        const sql = 'select assortment_id,course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\'';
        return database.query(sql, [assortmentIDArray]);
    }

    static getCourseDetailsFromAssortmentId(database, assortmentList) { // 40 - 50 ms
        const sql = 'select a.*,cdlcm.liveclass_course_id from (select *, case when meta_info in ("HINDI","ENGLISH") then meta_info else "ENGLISH" end as course_language from course_details cd where cd.assortment_type in ("course", "course_bundle") and cd.assortment_id in (?) and parent<>4 and cd.assortment_id not in (15,16) and ccm_id=1) as a left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id=a.assortment_id order by a.sub_assortment_type, a.course_language, FIELD(category,"IIT JEE","NEET","IIT JEE|NEET|FOUNDATION"), a.created_at desc';
        return database.query(sql, [assortmentList]);
    }

    static checkNKCInterestedDetails(database, assortmentId, mobile, tag, studentClass) { // 10 ms
        const sql = 'select * from leads_web_landing_page where assortment_id = ? and mobile = ? and tag = ? and student_class = ?';
        return database.query(sql, [assortmentId, mobile, tag, studentClass]);
    }

    static setNKCInterestedDetails(database, assortmentId, mobile, tag, studentClass) {
        const sql = 'insert ignore into leads_web_landing_page (assortment_id, mobile, tag, student_class) VALUES (?, ?, ?, ?)';
        return database.query(sql, [assortmentId, mobile, tag, studentClass]);
    }

    static getDNPropertyBanner(database, bucketName) { // 30 ms
        const sql = 'select * from dn_property where bucket = ? and is_active = 1';
        return database.query(sql, [bucketName]);
    }

    static getCourseDataByClassCategoryAndLocale(database, stClass, language, category) { // 30-50ms
        if (category && category.length) {
            const sql = 'SELECT a.assortment_id, a.class, a.display_description, a.category, a.meta_info, a.year_exam, b.liveclass_course_id FROM course_details as a left join course_details_liveclass_course_mapping as b on a.assortment_id=b.assortment_id WHERE a.class=? and a.category in ? and a.meta_info=? and a.is_active=1 and a.is_free=0 and a.assortment_type="course"';
            return database.query(sql, [stClass, [category], language]);
        }
        const sqlQuery = 'SELECT a.assortment_id, a.class, a.display_description, a.category, a.meta_info, a.year_exam, b.liveclass_course_id FROM course_details as a left join course_details_liveclass_course_mapping as b on a.assortment_id=b.assortment_id WHERE a.class=? and a.meta_info=? and a.is_active=1 and a.is_free=0 and a.assortment_type="course"';
        return database.query(sqlQuery, [stClass, language]);
    }

    static getPaymentReferralEntries(database, studentId) {
        // get payments after this srpd id 1833, as referral count was reset to 0 after this.
        const sql = 'select srpd.* from payment_info pi join student_referral_disbursement srpd on srpd.invitee_student_id = pi.student_id where pi.coupon_code = (select coupon_code from student_referral_course_coupons where student_id = ? and is_active =1) and pi.status = "SUCCESS" and srpd.amount != 150 and srpd.invitor_student_id = ? and srpd.payment_info_id in (pi.id, null) and srpd.id > 1833 order by pi.id ASC LIMIT 10';
        return database.query(sql, [studentId, studentId]);
    }

    static addReferralShareInfo(database, data) {
        const sql = 'insert into referral_share_data set ?';
        return database.query(sql, [data]);
    }

    static getRefreeSId(database, refereePhone) {
        const sql = 'select s.student_id as referee_student_id from students s where mobile=right(REPLACE(?," ",""),10)';
        return database.query(sql, [refereePhone]);
    }

    static setNKCOldStudentProofDetails(database, studentId, mobile, filePath, email, name) {
        const sql = 'insert into nkc_old_students (student_name, mobile, student_id, old_proof_url, student_email) values (?, ?, ?, ?, ?)';
        return database.query(sql, [name, mobile, studentId, filePath, email]);
    }

    static updateNKCOldStudentProofDetails(database, studentId, mobile, filePath) {
        const sql = 'update nkc_old_students set old_proof_url=? where student_id=? and mobile=?';
        return database.query(sql, [filePath, studentId, mobile]);
    }

    static checkNKCOldStudentProofDetails(database, studentId, mobile) {
        const sql = 'select * from nkc_old_students where student_id=? and mobile=?';
        return database.query(sql, [studentId, mobile]);
    }

    static getClassLocaleAssortments(database, studentClass, studentLocale) {
        const sql = 'select assortment_id from ccmid_class_locale_assortmentid_mapping where class= ? and locale=? and is_active=1';
        return database.query(sql, [studentClass, studentLocale]);
    }

    static setR2V2StudentId(database, studentId) {
        const sql = 'insert ignore into r2v2_students (student_id) values (?)';
        return database.query(sql, [studentId]);
    }

    static getWebActiveWidgetsByGroupId(database, groupId) { // 30 ms
        const sql = 'select * from web_landing_page_widgets where group_id=? and is_active = 1';
        return database.query(sql, [groupId]);
    }

    static setWebLeadsDetails(database, assortmentId, mobile, tag, studentClass, source) {
        const sql = 'insert ignore into leads_web_landing_page (assortment_id, mobile, tag, student_class, source) VALUES (?, ?, ?, ?, ?)';
        return database.query(sql, [assortmentId, mobile, tag, studentClass, source]);
    }

    static checkWebLeads(database, assortmentId, mobile, tag, studentClass, source) { // 10 ms
        const sql = 'select * from leads_web_landing_page where assortment_id = ? and mobile = ? and tag = ? and student_class = ? and source = ?';
        return database.query(sql, [assortmentId, mobile, tag, studentClass, source]);
    }

    static getReferralRewardWinnerData(database, srpd_id) {
        const sql = 'select * from referral_reward_winners where spd_id=? order by id DESC LIMIT 1';
        return database.query(sql, [srpd_id]);
    }

    static getFreeSubjectsForFreeClassVideoPage(database, studentClass, locale, categoryType) { // 60ms
        let sql = '';
        const language = locale && locale === 'hi' ? 'HINDI' : 'ENGLISH';
        if (+studentClass === 14) {
            sql = 'select cd2.* FROM ( select assortment_id from course_details where class=? and is_active=1 and assortment_type="course" and is_free=1 and category_type in (?) and assortment_id in (159772,159773,159774,159775,165049,165050,165051,165052,165053,165054,165055,165056,165057,165058,330514,330515,330516,330517,330518,330519,330520,330521,23,31,324960,324961,344177) ORDER by year_exam desc limit 1 ) as cd1 left join ( select course_resource_id,assortment_id from course_resource_mapping crm ) as crm on crm.assortment_id=cd1.assortment_id inner join course_details as cd2 on cd2.assortment_id=crm.course_resource_id GROUP by cd2.assortment_id';
            return database.query(sql, [studentClass, categoryType]);
        }
        sql = 'select cd2.* FROM ( select assortment_id from course_details where class=? and is_active=1 and assortment_type="course" and is_free=1 and category_type in (?) and assortment_id in (159772,159773,159774,159775,165049,165050,165051,165052,165053,165054,165055,165056,165057,165058,330514,330515,330516,330517,330518,330519,330520,330521,23,31,324960,324961,344177) and meta_info=? ORDER by year_exam desc limit 1 ) as cd1 left join ( select course_resource_id,assortment_id from course_resource_mapping crm ) as crm on crm.assortment_id=cd1.assortment_id inner join course_details as cd2 on cd2.assortment_id=crm.course_resource_id GROUP by cd2.assortment_id';
        return database.query(sql, [studentClass, categoryType, language]);
    }

    static getLatestLFVideoChapterWiseSql(database, stClass, language, chapter) { // 0.022 sec
        const sql = 'SELECT f.*,c.course_resource_id as chapter_assortment_id FROM course_details as a left join course_resource_mapping as b on a.assortment_id=b.assortment_id left join course_resource_mapping as c on b.course_resource_id=c.assortment_id left join course_resource_mapping as d on c.course_resource_id=d.assortment_id left join course_resource_mapping as e on d.course_resource_id=e.assortment_id left join course_resources as f on e.course_resource_id=f.id WHERE a.class = ? and a.meta_info=? and a.is_active=1 and a.is_free=1 and a.assortment_type="course" and a.category_type="BOARDS/SCHOOL/TUITION" and a.assortment_id in (159772,159773,159774,159775,165049,165050,165051,165052,165053,165054,165055,165056,165057,165058,330514,330515,330516,330517,330518,330519,330520,330521,23,31,324960,324961,344177) and b.resource_type="assortment" and c.name=? and e.resource_type="resource" and f.resource_type=1 GROUP by f.resource_reference ORDER by e.live_at desc limit 5';
        return database.query(sql, [stClass, language, chapter]);
    }

    static getSubjectDetailsByDisplayName(database, stClass, displayName) {
        const sql = 'select * from course_details where class = ? and display_name = ? and is_active >0';
        return database.query(sql, [stClass, displayName]);
    }

    static getLatestChapterOfSubject(database, assortmentId, chaptersList = null) {
        if (chaptersList) {
            const sql = `SELECT
                chapters.assortment_id as chapter_assortment_id
            from
                course_resource_mapping crm
                inner join  (
                SELECT
                    course_resource_id,
                    assortment_id
                from
                    course_resource_mapping crm
                WHERE
                    crm.assortment_id in (
                    select
                        crm_subject.course_resource_id as chapter_assortment_id
                    from
                        course_resource_mapping as crm_subject
                    where
                        assortment_id in (?)  and course_resource_id in (?))
                        and resource_type = 'assortment') as chapters on chapters.course_resource_id = crm.assortment_id  and crm.resource_type = 'resource' inner join course_resources cr
        on cr.id= crm.course_resource_id and cr.resource_type in (1,4,8)      and live_at < now()
            order by
                live_at DESC limit 1`;
            return database.query(sql, [assortmentId, chaptersList]);
        }
        const sql = `SELECT
        chapters.assortment_id as chapter_assortment_id
    from
        course_resource_mapping crm
        inner join  (
        SELECT
            course_resource_id,
            assortment_id
        from
            course_resource_mapping crm
        WHERE
            crm.assortment_id in (
            select
                crm_subject.course_resource_id as chapter_assortment_id
            from
                course_resource_mapping as crm_subject
            where
                assortment_id in (?))
                and resource_type = 'assortment') as chapters on chapters.course_resource_id = crm.assortment_id  and crm.resource_type = 'resource' inner join course_resources cr
on cr.id= crm.course_resource_id and cr.resource_type in (1,4,8)      and live_at < now()
    order by
        live_at DESC limit 1`;
        return database.query(sql, [assortmentId]);
    }

    static getVideoPageCarousels(database, studentClass) { // 30-40 ms
        const sql = 'select * from video_page_carousels where class=? and is_active=1';
        return database.query(sql, [studentClass]);
    }

    static getVideoPageOverRideQueries(database, classVal, locale) { // 20-30 ms
        const sql = 'select * from video_page_qids where class=? and locale=? and is_active=1';
        return database.query(sql, [classVal, locale]);
    }

    static getCourseResourceByReference(database, resourceReference) {
        const sql = 'select class, chapter from course_resources where resource_reference = ? and resource_type in (1,4,8) limit 1';
        return database.query(sql, [resourceReference]);
    }

    static getNextLectureOfSameSubjectVideoPage(database, qIds, batchID, courseAssortment) {
        const sql = 'select *, min(live_at) from (SELECT cr2.*, 1 as is_free, \'upNext\' as top_title1, crm6.live_at from (SELECT * FROM course_resources WHERE resource_reference in (?) and resource_type in (1,8)) as cr left join course_resource_mapping crm1 on cr.id=crm1.course_resource_id and crm1.resource_type=\'resource\' and crm1.batch_id=? left join course_resource_mapping crm2 on crm1.assortment_id=crm2.course_resource_id and crm2.resource_type=\'assortment\' left join course_resource_mapping crm3 on crm2.assortment_id=crm3.course_resource_id and crm3.resource_type=\'assortment\' inner join course_resource_mapping crmsub on crm3.assortment_id = crmsub.course_resource_id and crmsub.resource_type = \'assortment\' and (crmsub.assortment_id in (?) or crmsub.course_resource_id in (?)) left join course_resource_mapping crm4 on crm3.assortment_id=crm4.assortment_id and crm4.resource_type=\'assortment\' left join course_resource_mapping crm5 on crm4.course_resource_id=crm5.assortment_id and crm5.resource_type=\'assortment\' left join course_resource_mapping crm6 on crm5.course_resource_id=crm6.assortment_id and crm6.resource_type=\'resource\' and crm6.batch_id=? and (crm6.live_at < now() or crm6.live_at is null) left join course_resources cr2 on crm6.course_resource_id=cr2.id where cr2.resource_type in (1,8) and cr2.id>cr.id group by cr2.resource_reference) as f group by f.subject order by FIELD (resource_reference, ?)';
        return database.query(sql, [qIds, batchID, courseAssortment, courseAssortment, batchID, qIds]);
    }

    static getPostionForFeedCarousel(database) {
        const sql = 'select type, carousel_order from home_caraousels where type in (\'COURSES\',\'NUDGE\',\'TRENDING_EXAM\',\'TRENDING_BOARD\')';
        return database.query(sql);
    }

    static getFormActiveWidgetsByGroupId(database, groupId) { // 20 ms
        const sql = 'select * from web_form_widgets where group_id=? and is_active = 1';
        return database.query(sql, [groupId]);
    }

    static checkWebFormDetails(database, groupId, uniqueIdentifier) { // 20ms
        const sql = 'select * from web_form_responses where group_id=? and identifier=?';
        return database.query(sql, [groupId, uniqueIdentifier]);
    }

    static setWebFormDetails(database, groupId, variantId, uniqueIdentifier, obj) {
        const sql = 'insert into web_form_responses (group_id, variant_id, identifier, response) values (?,?,?,?)';
        return database.query(sql, [groupId, variantId, uniqueIdentifier, JSON.stringify(obj)]);
    }

    static getAssortmentDetails(database, assortmentId) {
        const sql = 'select * from course_details where assortment_id=? and is_active=1';
        // console.log(sql);
        return database.query(sql, [assortmentId]);
    }

    static getMobileBySId(database, studentId) {
        const sql = 'select mobile from students where student_id = ?';
        // console.log(sql);
        return database.query(sql, studentId);
    }

    static getAssortmentDetailsFromIdForExplorePageCampaign(db, assortmentId, studentClass, studentLocale) { // 50 ms
        let sql = 'select cd.*,cdlcm.liveclass_course_id,case when cabm.display_name is null then cd.display_name else cabm.display_name end as display_name, case when cabm.demo_video_thumbnail is null or cabm.demo_video_thumbnail = "" then cd.demo_video_thumbnail else cabm.demo_video_thumbnail end as demo_video_thumbnail from (select *,case when meta_info in (\'HINDI\',\'ENGLISH\') then meta_info else \'ENGLISH\' end as course_language from course_details where assortment_id in (?) and is_active=1) as cd left join (select assortment_id, liveclass_course_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id left join (select assortment_id as batch_table_assortment_id, display_name, demo_video_thumbnail from course_assortment_batch_mapping where is_active=1) as cabm on cabm.batch_table_assortment_id=cd.assortment_id group by cd.assortment_id';
        if (studentLocale === 'hi') {
            sql = 'select cd.*,cdlcm.liveclass_course_id,case when cabm.display_name is null then cd.display_name else cabm.display_name end as display_name, case when cabm.demo_video_thumbnail is null or cabm.demo_video_thumbnail = "" then cd.demo_video_thumbnail else cabm.demo_video_thumbnail end as demo_video_thumbnail from (select *,case when meta_info in (\'HINDI\',\'ENGLISH\') then meta_info else \'HINDI\' end as course_language from course_details where assortment_id in (?) and is_active=1) as cd left join (select assortment_id, liveclass_course_id from course_details_liveclass_course_mapping) as cdlcm on cdlcm.assortment_id=cd.assortment_id left join (select assortment_id as batch_table_assortment_id, display_name, demo_video_thumbnail from course_assortment_batch_mapping where is_active=1) as cabm on cabm.batch_table_assortment_id=cd.assortment_id group by cd.assortment_id';
        }
        return db.query(sql, [assortmentId, studentClass]);
    }

    static getCampaignScreenType(database, campaignName) {
        const sql = 'select a.*, b.* from campaign_redirection_mapping  as a inner join campaign_screen_mapping as b on a.id = b.campaign_id where a.campaign = ? ';
        return database.query(sql, [campaignName]);
    }

    static getFAQsForClp(database, bucket, locale) { // 20 ms
        const sql = 'select * from faq where bucket = ? and locale=? and is_active=1 order by priority';
        return database.query(sql, [bucket, locale]);
    }

    static getCourseListForNewCategoryPage(database, studentClass, locale) { // 20 ms
        const sql = 'SELECT distinct a.id , a.class ,a.locale ,a.course_exam, b.assortment_id FROM liveclass_course a left JOIN course_details_liveclass_course_mapping b on a.id = b.liveclass_course_id where a.is_free = 1 and a.id > 150 and b.vendor_id = 1 and a.class = ? and a.locale = ?';
        return database.query(sql, [studentClass, locale]);
    }

    static getCourseCampNotifData(database, sId) { // 0.0182 seconds
        const sql = "SELECT campaign, student_id FROM campaign_sid_mapping WHERE student_id = ? and campaign like 'CEO_REFERRAL;;;%' and is_active=1 order by id desc limit 1";
        return database.query(sql, [sId]);
    }

    static getSubjectsListByCourseAssortmentMultiple(db, assortmentID) { // 30 ms
        const sql = 'select *, display_name as title from (select course_resource_id, assortment_id as course_assortment from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\' ) as a inner join (select * from course_details where display_name not in (\'WEEKLY TEST\',\'ALL\',\'QUIZ\', \'ANNOUNCEMENT\',\'INTRODUCTION\')) as b on b.assortment_id=a.course_resource_id group by b.assortment_id';
        return db.query(sql, assortmentID);
    }

    static getBannersForNewClp(database, filterCategory, studentClass, locale) { // 20 ms
        const sql = 'select * from app_banners where description =? and class = ? and locale = ? and page_type=\'NEW_CLP\' and start_date < now() and end_date > now() and is_active=1 limit 1';
        return database.query(sql, [filterCategory, studentClass, locale]);
    }

    static getTopBannersNewClp(database, filterCategory, studentClass, locale) { // 40 ms
        const sql = 'select * from app_banners where description =? and (class = ? or class = "all") and locale = ? and page_type=\'NEW_CLP_TOP\' and start_date < now() and end_date > now() and is_active=1 order by banner_order';
        return database.query(sql, [filterCategory, studentClass, locale]);
    }

    static getLiveClassTopTeachersDataNewClp(database, stClass, language, categoryfinal) { // 90 ms
        const sql = 'SELECT lc.class, lc.locale, lc.course_exam,du.name as expert_name, b.faculty_id, b.faculty_name,b.image_url, b.subject_name_localised, b.college, b.rating, b.experience_in_hours, b.students_mentored, count(DISTINCT a.id) as number_classes from liveclass_course_details a left join course_details_liveclass_course_mapping cd on cd.liveclass_course_id = a.liveclass_course_id left join course_teacher_mapping b on a.faculty_id = b.faculty_id left join liveclass_course lc on lc.id = cd.liveclass_course_id left join dashboard_users du on du.id = b.faculty_id where du.is_active= 1 and b.is_free = 1 and cd.is_free = 1 and date(a.live_at) >= "2022-03-01" and date(a.live_at) <= CURRENT_DATE and lc.class = ? and lc.locale = ? and lc.course_exam = ? group by 1,2,3,4 having number_classes >= 5 order by number_classes desc';
        return database.query(sql, [stClass, language, categoryfinal]);
    }

    static getTopperTestimonialNewClp(database) {
        const sql = 'SELECT * FROM result_page_widget where carousel_type = "toppers_testimonial_video"';
        return database.query(sql);
    }
};
