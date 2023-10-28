// eslint-disable-next-line no-unused-vars
// const _ = require('lodash');
// const Utility = require('../utility');

module.exports = class Liveclass {
    // commenting out as there is no use of this variable
    // static liveVideoDetailsByResIdSql = 'SELECT a.resource_reference, a.expert_name, a.expert_image, a.player_type, a.meta_info, a.stream_status, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference IN (?)';

    static get(database, id) {
        const sql = `select * from liveclass where id=${id}`;
        console.log(sql);
        return database.query(sql);
    }

    static subscribe(database, data) {
        const sql = 'INSERT IGNORE INTO liveclass_subscribers set ?';
        console.log(sql);
        return database.query(sql, [data]);
    }

    static updateSubscribe(database, studentId, resourceId) {
        const sql = 'UPDATE liveclass_subscribers set is_view=1 where student_id = ? and resource_reference=?';
        console.log(sql);
        return database.query(sql, [studentId, resourceId]);
    }

    static checkSubscribe(database, studentId, resourceId) {
        const sql = 'select * from liveclass_subscribers where student_id = ? and resource_reference=?';
        console.log(sql);
        return database.query(sql, [studentId, resourceId]);
    }

    static getSubscribers(database, resourceId) {
        const sql = `select count(*) as length from liveclass_subscribers where resource_reference='${resourceId}' and is_interested=1`;
        // console.log(sql);
        return database.query(sql);
    }

    static getViewSubscribers(database, resourceId) {
        const sql = `select count(*) as length from liveclass_subscribers where resource_reference='${resourceId}' and is_interested=1 and is_view=1`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubscriberList(database, id) {
        const sql = `select * from (select student_id from liveclass_subscribers where resource_reference=${id}) as a left join (select student_id, gcm_reg_id from students) as b on a.student_id=b.student_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getByTypeAndID(database, type, id) {
        const sql = `select id, title, is_active from liveclass where mapped_type='${type}' and mapped_id=${id} order by id desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getPushUrlByFaculty(database, facultyId) {
        const sql = `select * from (select push_url,detail_id from liveclass_stream where faculty_id=${facultyId}) as a inner join (select * from liveclass_course_details where date(live_at)=CURRENT_DATE) as b on a.detail_id=b.id left join (select liveclass_course_detail_id, resource_reference from liveclass_course_resources where resource_type=4) as c on a.detail_id=c.liveclass_course_detail_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuizQuestions(database, detailID) {
        const sql = `select b.question_id, 0 as type, b.ocr_text,d.opt_1,d.opt_2,d.opt_3,d.opt_4,d.answer, b.is_answered, b.is_text_answered, a.liveclass_course_detail_id, e.resource_reference as liveclass_id, a.topic from (SELECT resource_reference,liveclass_course_detail_id, topic FROM liveclass_course_resources WHERE liveclass_course_detail_id = ${detailID} and resource_type=7) a left join (SELECT * from questions where is_text_answered=1) as b on a.resource_reference=b.question_id left join questions_localized as c on a.resource_reference = c.question_id left join text_solutions as d on a.resource_reference = d.question_id left join (SELECT resource_reference,liveclass_course_detail_id FROM liveclass_course_resources WHERE liveclass_course_detail_id = ${detailID} and resource_type=4) as e on a.liveclass_course_detail_id=e.liveclass_course_detail_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuizResourceByDetailID(database, detailID) {
        const sql = `select * FROM liveclass_course_resources WHERE liveclass_course_detail_id = ${detailID} and resource_type=7`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuizQuestionDetails(database, questionId) {
        const sql = `SELECT 0 as type, a.question_id, a.ocr_text,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer, a.is_answered, a.is_text_answered from (SELECT * from questions where question_id = ${questionId} ) as a left join questions_localized as b on a.question_id = b.question_id left join text_solutions as c on a.question_id = c.question_id order by a.doubt ASC`;
        console.log(sql);
        return database.query(sql);
    }

    static addQuizResponse(database, data) {
        const sql = 'INSERT IGNORE INTO liveclass_quiz_response set ?';
        console.log(sql);
        return database.query(sql, [data]);
    }

    static addQuizLog(database, data) {
        const sql = 'INSERT IGNORE INTO liveclass_quiz_logs set ?';
        console.log(sql);
        return database.query(sql, [data]);
    }

    static updateLiveClassInfoPushUrl(database, facultyID, pushUrl, detailID) {
        const sql = `update liveclass_stream set push_url = '${pushUrl}' where faculty_id=${facultyID} and detail_id=${detailID}`;
        console.log(sql);
        return database.query(sql);
    }

    static updateLiveClassInfoEndTime(database, detailID) {
        const sql = `update liveclass_stream set end_time = CURRENT_TIMESTAMP(), is_active=0 where detail_id=${detailID}`;
        console.log(sql);
        return database.query(sql);
    }

    static updateLiveClassInfoStartTime(database, detailID) {
        const sql = `update liveclass_stream set start_time = CURRENT_TIMESTAMP(), is_active=1 where detail_id=${detailID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getList(database, facultyID) {
        const sql = `select * from (select * from liveclass_stream where faculty_id=${facultyID} and end_time is null) as a inner join (select * from liveclass_course_details where live_at >= CURDATE() and live_at<date_add(CURRENT_DATE, INTERVAL 1 DAY)) as b on a.detail_id=b.id left join (select * from liveclass_course_resources where resource_type=4) as c on a.detail_id=c.liveclass_course_detail_id order by start_time desc limit 20`;
        console.log(sql);
        return database.query(sql);
    }

    static getBoardList(database, studentClass) {
        const sql = `select id, title from liveclass_course where class=${studentClass} and is_old=1 order by course_order`;
        console.log(sql);
        return database.query(sql);
    }

    static getBoardListV1(database, studentClass) {
        const sql = `select * from liveclass_course where class=${studentClass} and is_old=1 order by course_order`;
        console.log(sql);
        return database.query(sql);
    }

    static getBoardListV2(database, studentClass, ecmId) {
        const sql = `select * from liveclass_course where class=${studentClass} and is_old=0 and ecm_id=${ecmId} order by course_order`;
        console.log(sql);
        return database.query(sql);
    }

    static getFreeClass(database, courseID) {
        const sql = `select a.id as detail_id, a.is_replay, c.resource_reference as id,a.live_at, b.start_time,d.image_bg_liveclass,a.subject,b.is_active,c.topic, d.faculty_name, a.master_chapter, d.id as faculty_id, c.resource_type, c.player_type, f.title as board_name, f.is_free from
        (select * from liveclass_course_details where is_free=1 and liveclass_course_id=${courseID} and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)>=hour(CURRENT_TIMESTAMP)))) as a left join
        (select * from liveclass_stream) as b on a.id=b.detail_id inner join
        (select * from liveclass_course_resources where resource_type in (4,8)) as c on a.id=c.liveclass_course_detail_id left join
        (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join
        (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on e.faculty_id=d.id left join (select * from liveclass_course) as f on a.liveclass_course_id=f.id order by a.live_at asc`;
        console.log(sql);
        return database.query(sql);
    }

    static getBanner(database, versionCode) {
        const sql = `select image_url, action_activity,action_data from app_banners where class='all' and min_version_code<${versionCode} and max_version_code>${versionCode} and page_type='LIVECLASS'`;
        console.log(sql);
        return database.query(sql);
    }

    static getCourseIdByresourceReference(database, resourceReference) {
        const sql = 'select * from liveclass_course_resources where resource_reference=?';
        console.log(sql);
        return database.query(sql, [resourceReference]);
    }

    static getCourseDetailByresourceReference(database, resourceReference) {
        const sql = `select * from (select * from liveclass_course_resources where resource_reference='${resourceReference}') as a left join liveclass_course as b on a.liveclass_course_id=b.id and a.class=b.class `;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveclassCourseList(database, courseID) {
        const sql = `select 'ENGLISH MEDIUM' as medium,a.id as detail_id, a.master_chapter,a.subject,d.faculty_name, d.image_url, b.id as master_course_id, b.title as master_course_title, b.is_free from (select * from liveclass_course_details where liveclass_course_id = ${courseID} group by master_chapter) as a left join (select faculty_id,detail_id from liveclass_detail_faculty_mapping) as c on a.id=c.detail_id left join (select name as faculty_name, id,raw_image_url as image_url from etoos_faculty) as d on c.faculty_id=d.id left join (select * from liveclass_course) as b on b.id=a.liveclass_course_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveclassCourseListByArr(database, courseIDArr) {
        const sql = `select 'ENGLISH MEDIUM' as medium, a.id as master_course_id, a.title as master_course_title,b.id as detail_id, b.master_chapter, b.chapter,b.subject,d.faculty_name, d.image_url  from (select * from liveclass_course where id in (${courseIDArr})) as a left join (select * from liveclass_course_details) as b on a.id=b.liveclass_course_id left join (select faculty_id,detail_id from liveclass_detail_faculty_mapping) as c on b.id=c.detail_id left join (select name as faculty_name, id,raw_image_url as image_url from etoos_faculty) as d on c.faculty_id=d.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubscribedCourse(database, studentID) {
        const sql = 'select b.reference_id from (select * from student_package_subscription where student_id=? and start_date < now() and end_date > now()) as a inner join (select * from student_package where reference_type=\'liveclass\' ) as b on a.student_package_id=b.id';
        console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getResourcesWithCourseID(database, masterChapter, courseID) {
        const sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as details_id, b.resource_type, b.resource_reference,b.topic, b.player_type, f.faculty_name as mapped_faculty_name, f.image_url as mapped_faculty_image_url,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, f.description, f.faculty_subject as subject, f.course, f.experience, f.degree, f.college, f.image_bg_liveclass, g.is_active, a.is_free , h.title as board_name, b.meta_info from (SELECT * FROM liveclass_course_details where master_chapter = '${masterChapter}' and liveclass_course_id=${courseID} and is_replay<>1) as a left join liveclass_course_resources as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, description, subject as faculty_subject, 'IIT' as course, years_experience as experience, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getResources(database, masterChapter) {
        const sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as details_id, b.resource_type, b.resource_reference,b.topic, b.meta_info, b.player_type, f.faculty_name as mapped_faculty_name, f.image_url as mapped_faculty_image_url,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, f.description, f.faculty_subject as subject, f.course, f.experience, f.degree, f.college, f.image_bg_liveclass, g.is_active, a.is_free from (SELECT * FROM liveclass_course_details where master_chapter = '${masterChapter}' and is_replay<>1) as a left join liveclass_course_resources as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, image_url, description, subject as faculty_subject, course, experience, degree, college,image_bg_liveclass  from dashboard_users where type='FACULTY') as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id`;
        console.log(sql);
        return database.query(sql);
    }

    static checkSubscription(database, studentID, courseID) {
        const sql = `select a.* from (select * from student_package_subscription where start_date < now() and end_date > now() and student_id = ${studentID}) as a inner join (select * from student_package where reference_type='liveclass' and reference_id=${courseID}) as b on a.student_package_id=b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getBoardDetails(database, courseID) {
        const sql = `select * from liveclass_course where id=${courseID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getPostQuizDetails(database, resourceID) {
        const sql = `select * from (select * from liveclass_quiz_logs where resource_id=${resourceID}) as a left join (select * from liveclass_course_resources) as b on a.resource_detail_id=b.id left join (select * from liveclass_stream) as c on a.detail_id=c.detail_id`;
        console.log(sql);
        return database.query(sql);
    }

    static getLivestreamDetails(database, resourceID) {
        const sql = 'select b.*, c.name as faculty_name, d.live_at, a.resource_type  from (select * from liveclass_course_resources where resource_reference=? and resource_type in (1,4,8)) as a left join (select * from liveclass_stream) as b on a.liveclass_course_detail_id=b.detail_id left join (select * from etoos_faculty) as c on b.faculty_id=c.id left join (select id, live_at from liveclass_course_details) as d on a.liveclass_course_detail_id=d.id';
        console.log(sql);
        return database.query(sql, [resourceID.toString()]);
    }

    static getResourceDetails(database, detailID) {
        const sql = `select * from liveclass_course_resources where liveclass_course_detail_id='${detailID}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveResourceDetails(database, detailID) {
        const sql = `select * from liveclass_course_resources where liveclass_course_detail_id='${detailID}' and resource_type=4`;
        console.log(sql);
        return database.query(sql);
    }

    static updateQuestionAnswered(database, questionID) {
        const sql = `update questions set is_answered=1 where question_id='${questionID}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getResourceDetailsForStructuredCourse(database, detailID, studentClass) {
        const sql = `select *,CONCAT(g.days_class,' ',g.time_pm) as day_text,case when d.raw_image_url is NULL then a.expert_image else d.raw_image_url end as image_bg_liveclass, case when d.faculty_name is NULL then a.expert_name else d.faculty_name end as mapped_faculty_name from (select * from liveclass_course_resources where liveclass_course_detail_id=${detailID} and resource_type in (1,2,3,4,8)) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id left join (select faculty_id, detail_id from liveclass_detail_faculty_mapping) as c on a.liveclass_course_detail_id=c.detail_id left join (select name as faculty_name, id,raw_image_url, degree_obtained as degree from etoos_faculty) as d on c.faculty_id=d.id left join (select * from liveclass_stream) as e on a.liveclass_course_detail_id=e.detail_id inner join (select question_id,duration,answer_id,is_vdo_ready from answers where question_id<>0) as l on l.question_id=a.resource_reference left join liveclass_course as f on b.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=f.class and g.faculty_id = d.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getResourceDetailsFromCourseId(database, courseID, limit, page, subject) {
        let sql;
        if (subject === 'ALL') {
            sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as detail_id, b.resource_type, b.resource_reference,b.topic, b.player_type, case when f.faculty_name is NULL then b.expert_name else f.faculty_name end as mapped_faculty_name,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, a.subject, f.college,f.degree, g.is_active, h.is_free, b.meta_info,l.duration from (SELECT * FROM liveclass_course_details where liveclass_course_id=${courseID} and live_at<NOW() and is_replay<>1) as a left join (select * from liveclass_course_resources where resource_type in (1,4,8,9)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id and h.class=a.class left join (select question_id,duration,answer_id from answers where question_id<>0) as l on l.question_id=b.resource_reference and b.resource_type<>9 order by a.live_at DESC LIMIT ${limit} OFFSET ${page};`;
        } else {
            sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as detail_id, b.resource_type, b.resource_reference,b.topic, b.player_type, case when f.faculty_name is NULL then b.expert_name else f.faculty_name end as mapped_faculty_name,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, a.subject, f.college,f.degree, g.is_active, h.is_free, b.meta_info,l.duration from (SELECT * FROM liveclass_course_details where liveclass_course_id=${courseID} and live_at<NOW() and subject='${subject}' and is_replay<>1) as a left join (select * from liveclass_course_resources where resource_type in (1,4,8,9)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id and h.class=a.class left join (select question_id,duration,answer_id from answers where question_id<>0) as l on l.question_id=b.resource_reference order by a.live_at DESC LIMIT ${limit} OFFSET ${page};`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getUpcomingResourceDetailsFromCourseId(database, courseID, limit, page, subject) {
        let sql;
        if (subject === 'ALL') {
            sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as detail_id, b.resource_type, b.resource_reference,b.topic, b.player_type, case when f.faculty_name is NULL then b.expert_name else f.faculty_name end as mapped_faculty_name,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, a.subject, f.college,f.degree, g.is_active, h.is_free, b.meta_info,l.duration from (SELECT * FROM liveclass_course_details where liveclass_course_id=${courseID} and live_at>=NOW() and is_replay<>1) as a left join (select * from liveclass_course_resources where resource_type in (1,4,8,9)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id and h.class=a.class left join (select question_id,duration,answer_id from answers where question_id<>0) as l on l.question_id=b.resource_reference order by a.live_at LIMIT ${limit} OFFSET ${page};`;
        } else {
            sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as detail_id, b.resource_type, b.resource_reference,b.topic, b.player_type, case when f.faculty_name is NULL then b.expert_name else f.faculty_name end as mapped_faculty_name,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, a.subject, f.college,f.degree, g.is_active, h.is_free, b.meta_info,l.duration from (SELECT * FROM liveclass_course_details where liveclass_course_id=${courseID} and live_at>=NOW() and subject='${subject}') as a left join (select * from liveclass_course_resources where resource_type in (1,4,8,9)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id and h.class=a.class left join (select question_id,duration,answer_id from answers where question_id<>0) as l on l.question_id=b.resource_reference order by a.live_at LIMIT ${limit} OFFSET ${page};`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getNotesFromCourseId(database, courseID, limit, page, subject) {
        let sql;
        if (subject === 'ALL') {
            sql = `select trim(a.resource_reference) as resource_reference, b.subject,a.topic, f.is_free, b.master_chapter FROM (select * from liveclass_course_resources where liveclass_course_id=${courseID} and resource_type in (2,3)) AS a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=b.class where a.resource_reference like 'https%' group by trim(a.resource_reference), b.subject, f.is_free, a.topic, b.master_chapter order by b.subject,b.master_chapter,a.topic LIMIT ${limit} OFFSET ${page}`;
        } else {
            sql = `select trim(a.resource_reference) as resource_reference, b.subject,a.topic, f.is_free, b.master_chapter FROM (select * from liveclass_course_resources where liveclass_course_id=${courseID} and resource_type in (2,3) and subject='${subject}') AS a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=b.class where a.resource_reference like 'https%' group by trim(a.resource_reference), b.subject, f.is_free, a.topic, b.master_chapter order by b.subject,b.master_chapter,a.topic LIMIT ${limit} OFFSET ${page}`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getRelatedLectures(database, detailID, chapter, courseID, studentClass) {
        const sql = `Select a.liveclass_course_id, b.id as resource_id, a.id as detail_id, b.resource_type, b.resource_reference,b.topic, b.player_type, case when f.faculty_name is NULL then b.expert_name else f.faculty_name end as mapped_faculty_name,a.live_at,a.master_chapter, a.chapter,b.player_type,f.id as faculty_id, a.subject, f.college,f.degree, g.is_active, h.is_free,h.category_id,h.course_type, b.meta_info,l.duration from (SELECT * FROM liveclass_course_details where master_chapter = '${chapter}' and liveclass_course_id=${courseID} and id<>${detailID} and is_replay<>1) as a left join (select * from liveclass_course_resources where resource_type in (1,4,8)) as b on a.id=b.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id, subject as faculty_subject, degree_obtained as degree, college,raw_image_url as image_bg_liveclass,raw_image_url as image_url from etoos_faculty) as f on e.faculty_id=f.id left join (select is_active, detail_id from liveclass_stream) as g on a.id=g.detail_id left join liveclass_course as h on a.liveclass_course_id=h.id and h.class=${studentClass} inner join (select question_id,duration,answer_id,is_vdo_ready from answers where question_id<>0) as l on l.question_id=b.resource_reference order by a.live_at;`;
        console.log(sql);
        return database.query(sql);
    }

    static getResourceDetailsByID(database, resourceDetailID) {
        const sql = `select * from (select * from liveclass_course_resources where id='${resourceDetailID}') as a left join (select id, class from liveclass_course) as b on a.liveclass_course_id=b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static updateVodUrl(database, questionID, url) {
        const query = `update answers set answer_video = '${url}', is_vdo_ready = 3 where question_id=${questionID}`;
        console.log(query);
        return database.query(query);
    }

    static updateResource(database, detailResourceID, resourceReference) {
        const query = `update liveclass_course_resources set resource_reference = '${resourceReference}' where id=${detailResourceID}`;
        console.log(query);
        return database.query(query);
    }

    static addResource(database, data) {
        const query = 'INSERT IGNORE INTO liveclass_course_resources set ?';
        console.log(query);
        return database.query(query, [data]);
    }

    static getQuizResponse(database, quizQuestionID, resourceDetailID, detailID, studentID) {
        const query = `select * from liveclass_quiz_response where quiz_question_id=${quizQuestionID} and resource_detail_id=${resourceDetailID} and detail_id=${detailID} and student_id=${studentID}`;
        console.log(query);
        return database.query(query);
    }

    static getRecentQuizReference(database, resourceReference) {
        const query = 'select * from liveclass_quiz_logs where resource_id=? order by created_at desc limit 1';
        console.log(query);
        return database.query(query, [resourceReference]);
    }

    static getDetailsByID(database, id) {
        const query = `select * from liveclass_course_details where id=${id}`;
        console.log(query);
        return database.query(query);
    }

    static getLiveSection(database, courseID, courseType, subject, studentClass) {
        let sql = '';
        if (subject === '0') {
            sql = `select a.id as detail_id,CONCAT(g.days_class,' ',g.time_pm) as day_text,c.meta_info, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,a.class,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name,d.degree_obtained, a.master_chapter, d.id as faculty_id, a.chapter,f.home_carousel_title, c.player_type, c.resource_type, f.is_free, f.course_type,c.resource_reference from 
            (select * from liveclass_course_details where live_at >= CURDATE() and liveclass_course_id=${courseID}) as a 
            left join 
            liveclass_stream as b on a.id=b.detail_id 
            inner join 
            (select * from liveclass_course_resources where resource_type in (1,4)) as c on a.id=c.liveclass_course_detail_id 
            left join 
            (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id 
            left join 
            (select name as faculty_name, id,raw_image_url as image_bg_liveclass, degree_obtained from etoos_faculty) as d on e.faculty_id=d.id 
            left join 
            liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} 
            left join 
            liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id where a.live_at>=CURDATE() or b.is_active = 1 order by a.live_at asc`;
        } else {
            sql = `select a.id as detail_id,c.meta_info, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject, a.class, b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name,d.degree_obtained, a.master_chapter, d.id as faculty_id, a.chapter,f.home_carousel_title, c.player_type, c.resource_type, f.is_free, f.course_type, c.resource_reference from (select * from liveclass_course_details where live_at >= CURDATE() and liveclass_course_id=${courseID} and subject='${subject}') as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4)) as c on a.id=c.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass, degree_obtained from etoos_faculty) as d on e.faculty_id=d.id left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} where a.live_at>=CURDATE() or b.is_active = 1 order by a.live_at asc`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getLiveSectionHome(database, courseID, courseType, subject, studentClass) {
        let sql;
        if (subject === 'ALL') {
            sql = "select a.id as detail_id,CONCAT(g.days_class,' ',g.time_pm) as day_text,c.meta_info, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,a.class,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name,d.degree_obtained, a.master_chapter, d.id as faculty_id, a.chapter,f.home_carousel_title, c.player_type, c.resource_type, f.is_free, f.course_type,a.is_replay,f.title,f.description,f.category_id,h.is_vdo_ready,h.vdo_cipher_id from (select * from liveclass_course_details where liveclass_course_id= ? and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)>=hour(CURRENT_TIMESTAMP)))) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass, degree_obtained from etoos_faculty) as d on e.faculty_id=d.id inner join answers as h on h.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=? left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=? and g.faculty_id = d.id and g.subject_class = a.subject where a.live_at>=CURDATE() or b.is_active = 1 order by a.live_at asc";
            return database.query(sql, [courseID, studentClass, studentClass]);
        }
        sql = "select a.id as detail_id,CONCAT(g.days_class,' ',g.time_pm) as day_text,c.meta_info, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,a.class,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name,d.degree_obtained, a.master_chapter, d.id as faculty_id, a.chapter,f.home_carousel_title, c.player_type, c.resource_type, f.is_free, f.course_type,a.is_replay,f.title,f.description,f.category_id from (select * from liveclass_course_details where liveclass_course_id=? and subject=? and (live_at >=CURRENT_TIMESTAMP OR (date(live_at)=CURRENT_DATE and hour(live_at)>=hour(CURRENT_TIMESTAMP)))) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass, degree_obtained from etoos_faculty) as d on e.faculty_id=d.id left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=? left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=? and g.faculty_id = d.id where a.live_at>=CURDATE() or b.is_active = 1 order by a.live_at asc";

        return database.query(sql, [courseID, subject, studentClass, studentClass]);
    }

    static getLiveSectionV1(database, courseID, courseType, subject, studentClass) {
        let sql = '';
        if (!subject) {
            sql = `select a.id as detail_id,f.class, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type from (select * from liveclass_course_details where liveclass_course_id=${courseID}) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id left join (select duration,question_id from answers) as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} order by a.live_at asc;`;
        } else {
            sql = `select a.id as detail_id,f.class, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type from (select * from liveclass_course_details where liveclass_course_id=${courseID} and subject='${subject}') as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id left join (select duration,question_id from answers) as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} order by a.live_at asc;`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getLiveSectionPastAndLive(database, courseID, courseType, subject, studentClass) {
        let sql = '';
        if (!subject) {
            sql = `select a.id as detail_id,CONCAT(g.days_class,' ',g.time_pm) as day_text,a.class, c.resource_reference ,c.meta_info, a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type,f.category_id,e.is_vdo_ready from (select * from liveclass_course_details where liveclass_course_id=${courseID} and live_at<=CURRENT_TIME()) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by a.live_at desc limit 20;`;
        } else {
            sql = `select a.id as detail_id,a.class, c.resource_reference ,c.meta_info, a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type,f.category_id,e.is_vdo_ready from (select * from liveclass_course_details where liveclass_course_id=${courseID} and subject='${subject}' and live_at<=CURRENT_TIME()) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by a.live_at desc limit 20;`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getLiveSectionUpcoming(database, courseID, courseType, subject, studentClass) {
        let sql = '';
        if (!subject) {
            sql = `select a.id as detail_id,CONCAT(g.days_class,' ',g.time_pm) as day_text, a.class, c.resource_reference ,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type,f.category_id from (select * from liveclass_course_details where liveclass_course_id=${courseID} and live_at > CURRENT_TIME()) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by a.live_at asc limit 15;`;
        } else {
            sql = `select a.id as detail_id ,CONCAT(g.days_class,' ',g.time_pm) as day_text, a.class, c.resource_reference ,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type,f.category_id from (select * from liveclass_course_details where liveclass_course_id=${courseID} and subject='${subject}' and live_at>CURRENT_TIME()) as a left join (select * from liveclass_stream) as b on a.id=b.detail_id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by a.live_at asc limit 15;`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getTrendingLectures(database, ecmID, subject, studentClass) {
        let sql = '';
        if (!subject) {
            sql = `select a.id as detail_id, CONCAT(g.days_class,' ',g.time_pm) as day_text, a.class, c.resource_reference ,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type from (select * from liveclass_trending_lectures where ecm_id in (${ecmID.join(',')}) group by question_id order by video_time desc) as h inner join (select * from liveclass_course_resources) as c on h.question_id=c.resource_reference and h.resource_type=c.resource_type and h.course_id=c.liveclass_course_id inner join  (select * from liveclass_course_details) as a on a.id=c.liveclass_course_detail_id left join (select * from liveclass_stream) as b on a.id=b.detail_id left join  (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by h.video_time desc, a.live_at desc limit 15`;
        } else {
            sql = `select a.id as detail_id, CONCAT(g.days_class,' ',g.time_pm) as day_text, a.class, c.resource_reference ,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as mapped_faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration, f.is_free, f.course_type from (select * from liveclass_trending_lectures where ecm_id in (${ecmID.join(',')}) and subject='${subject}' group by question_id order by video_time desc) as h inner join (select * from liveclass_course_resources) as c on h.question_id=c.resource_reference and h.resource_type=c.resource_type inner join  (select * from liveclass_course_details) as a on a.id=c.liveclass_course_detail_id left join (select * from liveclass_stream) as b on a.id=b.detail_id left join  (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id inner join answers as e on e.question_id=c.resource_reference left join liveclass_course as f on a.liveclass_course_id=f.id and f.class=${studentClass} left join liveclass_faculty_timetable as g on g.course_id=f.id and g.class=${studentClass} and g.faculty_id = d.id order by h.video_time desc, a.live_at desc limit 15`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getDetailList(database, courseID, courseType, subject) {
        let sql = '';
        if (subject === '0') {
            sql = `select a.liveclass_course_id,a.id as liveclass_course_detail_id,a.chapter,a.subject, sum(c.duration) as duration, a.live_at, b.resource_type, b.resource_reference, b.meta_info from (select * from liveclass_course_details where liveclass_course_id=${courseID}) as a left join (select * from liveclass_course_resources where resource_type in (1, 8, 9)) as b on a.id=b.liveclass_course_detail_id left join (select duration, question_id,is_vdo_ready from answers where question_id!=0) as c on c.question_id=b.resource_reference group by a.id order by a.live_at asc`;
        } else {
            sql = `select a.liveclass_course_id,a.id as liveclass_course_detail_id,a.chapter,a.subject, sum(c.duration) as duration, a.live_at, b.resource_type, b.resource_reference, b.meta_info from (select * from liveclass_course_details where liveclass_course_id=${courseID} and subject='${subject}') as a left join (select * from liveclass_course_resources where resource_type in (1, 8, 9)) as b on a.id=b.liveclass_course_detail_id inner join (select duration, question_id,is_vdo_ready from answers where question_id!=0) as c on c.question_id=b.resource_reference group by a.id order by a.live_at asc`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getDetailListV1(database, courseID, limit, page, subject) {
        let sql = '';
        if (subject === 'ALL') {
            sql = `select b.liveclass_course_id,a.id as detail_id,a.master_chapter as chapter,a.subject, sum(c.duration) as duration,count(*) as lecture_count, a.live_at, b.resource_type, b.resource_reference, case when d.faculty_name is null then b.expert_name else d.faculty_name end as faculty_name from (select * from liveclass_course_resources where resource_type in (1,4,8) and liveclass_course_id=${courseID}) as b left join (select id,master_chapter,subject,live_at,faculty_id from liveclass_course_details ) as a on a.id=b.liveclass_course_detail_id left join (select duration, question_id from answers where question_id!=0) as c on c.question_id=b.resource_reference left join (select name as faculty_name, id,degree_obtained as degree from etoos_faculty) as d on d.id=a.faculty_id group by a.master_chapter order by a.live_at asc LIMIT ${limit} OFFSET ${page}`;
        } else {
            sql = `select b.liveclass_course_id,a.id as detail_id,a.master_chapter as chapter,a.subject, sum(c.duration) as duration,count(*) as lecture_count, a.live_at, b.resource_type, b.resource_reference, case when d.faculty_name is null then b.expert_name else d.faculty_name end as faculty_name from (select * from liveclass_course_resources where resource_type in (1,4,8) and liveclass_course_id=${courseID} and subject='${subject}') as b left join (select id,master_chapter,subject,live_at,faculty_id from liveclass_course_details ) as a on a.id=b.liveclass_course_detail_id left join (select duration, question_id from answers where question_id!=0) as c on c.question_id=b.resource_reference left join (select name as faculty_name, id,degree_obtained as degree from etoos_faculty) as d on d.id=a.faculty_id group by a.master_chapter order by a.live_at asc LIMIT ${limit} OFFSET ${page}`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getCourseDetails(database, courseID) {
        const sql = `select * from liveclass_course where id=${courseID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getCourseDetailsV1(database, courseID, studentClass) {
        const sql = `select * from liveclass_course where id=${courseID} and class=${studentClass}`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubjectsList(database, courseID) {
        const sql = `SELECT DISTINCT subject FROM liveclass_course_details WHERE liveclass_course_id = ${courseID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubjectsListV2(database, ecmId) {
        const sql = `SELECT b.subject FROM liveclass_course as a left join liveclass_course_details as b on a.id=b.liveclass_course_id WHERE a.ecm_id =${ecmId} and b.liveclass_course_id is not null group by b.subject`;
        console.log(sql);
        return database.query(sql);
    }

    static getSubjectsListV3(database, ecmId, studentClass) {
        const sql = `SELECT b.subject FROM (select * from liveclass_course where ecm_id in (${ecmId.join(',')}) and class=${studentClass}) as a left join liveclass_course_details as b on a.id=b.liveclass_course_id left join liveclass_course_resources as c on c.liveclass_course_detail_id =b.id WHERE b.liveclass_course_id is not null and c.resource_type in (1,4,8) group by b.subject`;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveAtByQuestionId(database, questionId) {
        const sql = `SELECT b.live_at FROM (select liveclass_course_detail_id from liveclass_course_resources where resource_reference=${questionId} and resource_type=1 and player_type='livevideo') as a join liveclass_course_details as b on a.liveclass_course_detail_id=b.id and b.course_type='LC'`;
        console.log(sql);
        return database.query(sql);
    }

    static getCourseByEcmID(database, ecmID, studentClass) {
        const sql = `select * from liveclass_course where ecm_id in (${ecmID}) and class=${studentClass}`;
        console.log(sql);
        return database.query(sql);
    }

    static getFacultyByEmailAndPassword(database, email, password) {
        const sql = `select id, email, name, created_at, type, student_id, image_bg_liveclass as image from dashboard_users where email='${email}' and password='${password}' and is_deleted=0`;
        console.log(sql);
        return database.query(sql);
    }

    static getFastCorrectAnswer(database, quizQuestionID, detailID) {
        const sql = `select * from liveclass_quiz_response where is_correct=1 and created_at< NOW() and quiz_question_id=${quizQuestionID} and detail_id=${detailID} order by created_at asc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getStreamDetails(database, detailID) {
        const sql = `select * from liveclass_stream where detail_id=${detailID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getUserPointsByResourceID(database, resourceID, studentID) {
        const sql = `select sum(points) as total_points from liveclass_quiz_response where resource_detail_id=${resourceID} and student_id=${studentID}`;
        console.log(sql);
        return database.query(sql);
    }

    static getUserScoreClasswise(database, studentID) {
        const sql = `select c.class, sum(a.points) as total_point_class from (select * from liveclass_quiz_response where student_id=${studentID} and date(created_at) = CURDATE()) as a left join (select * from liveclass_course_details) as b on a.detail_id=b.id left join (select * from liveclass_course) as c on b.liveclass_course_id=c.id where date(b.live_at)=CURDATE() group by c.class ORDER BY total_point_class DESC`;
        console.log(sql);
        return database.query(sql);
    }

    static getStatus(database, resourceReference) {
        const sql = `select * from (select * from liveclass_course_resources where resource_reference=${resourceReference}) as a left join (select * from liveclass_course_details) as b on a.liveclass_course_detail_id=b.id left join (select * from liveclass_stream) as c on a.liveclass_course_detail_id=c.detail_id`;
        console.log(sql);
        return database.query(sql);
    }

    static insertInactiveAnswerView(database, data) {
        const sql = 'INSERT into liveclass_inactive_views_stats set ?';
        console.log(sql);
        return database.query(sql, [data]);
    }

    static getCaraouselQids(database) {
        const sql = 'select * from (select question_id from liveclass_video_caraousel order by q_order asc) as a left join (select question_id, ocr_text from questions where student_id < 100) as b on a.question_id=b.question_id';
        return database.query(sql);
    }

    static getAllCourse(database) {
        const sql = 'SELECT  distinct(a.id) as course_id, a.class, a.locale, a.ecm_display as course_name from liveclass_course as a left join course_details_liveclass_course_mapping as b on a.id=b.liveclass_course_id where a.id=0';
        return database.query(sql);
    }

    static getAllCourseV2(database) {
        const sql = 'select a.*, b.display_name, b.class, b.meta_info as locale from (select case when assortment_id in (1,159774,348150) then 159774 when assortment_id in (3,159775,348146) then 159775 when assortment_id in (6,165055) then 165055 when assortment_id in (8,165056,348149) then 165056 when assortment_id in (2,165057,348151) then 165057 when assortment_id in (4,165058,348147) then 165058 when assortment_id in (5,159772) then 159772 when assortment_id in (7,159773,348148) then 159773 when assortment_id in (21,165053) then 165053 when assortment_id in (19,165051) then 165051 when assortment_id in (26,165052) then 165052 when assortment_id in (18,165049) then 165049 when assortment_id in (25,165050) then 165050 when assortment_id in (29,330519) then 330519 when assortment_id in (91153,330515) then 330515 when assortment_id in (77589,330521) then 330521 when assortment_id in (91151,330517) then 330517 when assortment_id in (30,330518) then 330518 when assortment_id in (91154,330514) then 330514 when assortment_id in (17929,330520) then 330520 when assortment_id in (91152,330516) then 330516 else assortment_id end as course_id from classzoo1.course_details_liveclass_course_mapping cdlcm where vendor_id = 1 and is_free = 1 and assortment_id not in (9) group by 1) as a inner join course_details as b on a.course_id=b.assortment_id group by a.course_id';
        return database.query(sql);
    }

    static getRecentCorrect(database, studentID, courseArray, date) {
        // const sql = `select b.liveclass_course_id from (select * from liveclass_quiz_response where student_id=${studentID} and date(created_at) = '${date}') as a inner join (select * from liveclass_course_details where liveclass_course_id in (${courseArray}) and date(live_at)='${date}') as b on a.detail_id=b.id order by a.created_at desc limit 1`;
        const sql = `select c.liveclass_course_id from (select * from liveclass_quiz_response where student_id=${studentID} and date(created_at) = '${date}' and version_code is not null) as a left join (select * from course_resources) as b on a.detail_id=b.id left join (select * from liveclass_course_details where liveclass_course_id in (${courseArray}) and date(live_at)='${date}') as c on b.old_detail_id=c.id order by a.created_at desc limit 1`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuizResource(database, detailID, resourceReference) {
        const sql = `select * from liveclass_course_resources where liveclass_course_detail_id = ${detailID} and resource_reference = '${resourceReference}' and resource_type = 7`;
        console.log(sql);
        return database.query(sql);
    }

    static getLiveClassByChapter(database, chapterName, classVal) {
        const sql = 'SELECT e.*, f.duration FROM (SELECT c.*, d.is_active, d.is_free FROM (SELECT a.id AS resource_id, a.resource_reference, a.resource_type, a.subject, a.topic, a.expert_name AS mapped_faculty_name, a.expert_image, a.class, a.player_type, a.stream_status, a.chapter, a.name, a.display, a.description, b.live_at, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.topic = ? AND b.resource_type = \'resource\' AND (a.resource_type = 8 OR (a.resource_type = 4 AND a.stream_status != \'INACTIVE\') OR (a.resource_type = 1 AND date(b.live_at) >= CURDATE())) AND a.class = ?) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id WHERE d.is_free = 1) AS e LEFT JOIN answers AS f ON e.resource_reference = f.question_id ORDER BY e.resource_id DESC';
        return database.query(sql, [chapterName, classVal]);
    }

    static getAllLiveClassesForDay(db, backDay = 1) {
        const sql = `select cr.id as resource_id, lcr.resource_reference as question_id, lcd.id as detail_id, a.answer_id, avr.id as answer_resource_id, avr.resource, avr.resource_order, avr.is_active, avr.resource_type
    from liveclass_course_resources lcr
    left join liveclass_course_details lcd on lcr.liveclass_course_detail_id=lcd.id
    left join answers a on a.question_id=lcr.resource_reference
    left join answer_video_resources avr on a.answer_id=avr.answer_id
    left join course_resources cr on cr.old_resource_id=lcr.id
    where lcd.live_at BETWEEN subdate(current_date, ${backDay + 1}) and subdate(current_date, ${backDay}) and lcr.resource_type=4 and cr.resource_type=4
    order by lcr.resource_reference, avr.resource_order`;
        return db.query(sql);
    }

    static checkLiveClassVideo(database, question_id) {
        const sql = `SELECT * FROM course_resources WHERE resource_reference = '${question_id}' AND resource_type IN (1,4,8)`;
        return database.query(sql);
    }

    static getLiveDataByQid(database, question_id) {
        const sql = `SELECT c.*, d.meta_info FROM (SELECT a.*, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference = '${question_id}' AND a.resource_type IN (1,4,8)) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id ORDER BY c.live_at_timestamp DESC`;
        return database.query(sql);
    }

    static getLiveClassByChapterForDoubtFeed(database, chapterName, classVal) {
        const sql = `SELECT e.*, MAX(f.answer_id) AS answer_id, f.duration FROM (SELECT c.*, d.is_active, d.is_free FROM (SELECT a.id AS resource_id, a.resource_reference, a.resource_type, a.subject, a.topic, a.expert_name AS mapped_faculty_name, a.expert_image, a.class, a.player_type, a.stream_status, a.chapter, a.name, a.display, a.description, b.live_at, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.topic LIKE '%${chapterName}%' AND b.resource_type = 'resource' AND b.live_at < now() AND (a.resource_type IN (1,8) OR (a.resource_type = 4 AND a.stream_status = 'ACTIVE'))) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id WHERE d.class = ? AND d.is_free = 1) AS e LEFT JOIN answers AS f ON e.resource_reference = f.question_id ORDER BY e.resource_id DESC`;
        return database.query(sql, [classVal]);
    }

    static getLiveVideoByQid(database, resourceId) {
        const sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id, f.duration FROM (SELECT c.*, d.is_active, d.is_free FROM (SELECT a.id AS resource_id, a.resource_reference, a.resource_type, a.subject, a.topic, a.expert_name AS mapped_faculty_name, a.expert_image, a.class, a.player_type, a.stream_status, a.chapter, a.name, a.display, a.description, b.live_at, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.id = ?) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id WHERE d.is_free = 1) AS e LEFT JOIN answers AS f ON e.resource_reference = f.question_id ORDER BY e.resource_id DESC';
        return database.query(sql, [resourceId]);
    }

    static getLiveVideoByResId(database, liveVideoId) {
        const sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id, f.duration FROM (SELECT c.*, d.is_active, d.is_free FROM (SELECT a.id AS resource_id, a.resource_reference, a.resource_type, a.subject, a.topic, a.expert_name AS mapped_faculty_name, a.expert_image, a.class, a.player_type, a.stream_status, a.chapter, a.name, a.display, a.description, b.live_at, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference = ?) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id WHERE d.is_free = 1) AS e LEFT JOIN answers AS f ON e.resource_reference = f.question_id ORDER BY e.resource_id DESC LIMIT 1';
        return database.query(sql, [liveVideoId]);
    }

    /**
     * Runs the query to get video details for a list of resource IDs
     * @param {mysql.Database} database
     * @param {String[]} qids
     */
    static getLiveVideoDetailsByResId(database, qids) {
        const sql = 'SELECT a.resource_reference, a.expert_name, a.expert_image, a.player_type, a.meta_info, a.stream_status, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference IN (?)';
        return database.query(sql, [qids]);
    }

    static getDataByResIdStuId(database, resourceID, studentID, liveAt) {
        const sql = 'SELECT * FROM liveclass_subscribers WHERE resource_reference = ? AND student_id = ? AND live_at = ?';
        return database.query(sql, [resourceID, studentID, liveAt]);
    }

    static updateSubscribersData(database, resourceID, studentID, liveAt, obj) {
        const sql = `UPDATE liveclass_subscribers SET ? WHERE resource_reference = ${resourceID} AND student_id = ${studentID} AND live_at = '${liveAt}'`;
        return database.query(sql, [obj]);
    }

    static getAssortmentByLiveclass(database, liveclassCourseIds) {
        const sql = 'select * from course_details_liveclass_course_mapping where liveclass_course_id in (?)';
        return database.query(sql, [liveclassCourseIds]);
    }

    static getLiveVideoFullDetailsByResId(database, qids) { // 40-50 ms
        const sql = 'SELECT e.*, f.image_bg_liveclass, f.image_url FROM (SELECT c.assortment_id, c.resource_id, c.resource_reference, c.expert_name, c.expert_image, c.player_type, c.meta_info, c.stream_status, c.display, c.subject, c.chapter_meta, c.live_at, c.faculty_id, d.class, d.is_free FROM (SELECT a.id AS resource_id, a.resource_reference, a.expert_name, a.expert_image, a.player_type, a.meta_info, a.stream_status, a.display, a.subject, a.faculty_id, b.assortment_id, b.live_at, a.chapter as chapter_meta FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference IN (?)) AS c LEFT JOIN course_details as d ON c.assortment_id = d.assortment_id) AS e LEFT JOIN dashboard_users AS f ON e.faculty_id = f.id';
        return database.query(sql, [qids]);
    }

    /*
        This will be using in next release ---
        static getPaidPdfByType(database, chapter, subject, type) {
            const sql = 'SELECT resource_combine.*, cd.assortment_id, cd.is_free FROM (SELECT cr.id, cr.resource_reference, cr.resource_type, cr.subject, cr.topic, cr.meta_info, crm.assortment_id FROM `course_resources` cr LEFT JOIN course_resource_mapping crm ON cr.id = crm.course_resource_id WHERE cr.`resource_type` = 2 AND cr.topic = ? AND cr.subject = ? AND cr.meta_info = ? AND crm.resource_type = "resource") AS resource_combine LEFT JOIN course_details cd ON resource_combine.assortment_id = cd.assortment_id WHERE cd.is_free = 0 ORDER BY cd.assortment_id DESC LIMIT 1';
            return database.query(sql, [chapter, subject, type]);
        }
    */

    static getTypeWiseCard(database, subject, studentClass, subjectCheck, boardName = []) {
        // 5 ms
        if (subjectCheck) {
            if (boardName.length > 0) {
                const sql = "SELECT assortment_id, class, display_name, display_description, category, max_retail_price, final_price, meta_info, is_active, is_free, assortment_type, year_exam, category_type FROM `course_details` WHERE `assortment_type` = 'subject' AND display_name = ? AND class = ? AND category IN (?) AND is_active = 1 AND is_free = 0 ORDER BY assortment_id DESC LIMIT 25";
                return database.query(sql, [subject, studentClass, boardName]);
            }
            const sql = "SELECT assortment_id, class, display_name, display_description, category, max_retail_price, final_price, meta_info, is_active, is_free, assortment_type, year_exam, category_type FROM `course_details` WHERE `assortment_type` = 'subject' AND display_name = ? AND class = ? AND is_active = 1 AND is_free = 0 ORDER BY assortment_id DESC LIMIT 25";
            return database.query(sql, [subject, studentClass]);
        }
        if (boardName.length > 0) {
            const sql = "SELECT assortment_id, class, display_name, display_description, category, max_retail_price, final_price, meta_info, is_active, is_free, assortment_type, year_exam, category_type FROM `course_details` WHERE `assortment_type` = 'course' AND class = ? AND category IN (?) AND is_active = 1 AND is_free = 0 ORDER BY assortment_id DESC LIMIT 25";
            return database.query(sql, [studentClass, boardName]);
        }
        const sql = "SELECT assortment_id, class, display_name, display_description, category, max_retail_price, final_price, meta_info, is_active, is_free, assortment_type, year_exam, category_type FROM `course_details` WHERE `assortment_type` = 'course' AND class = ? AND is_active = 1 AND is_free = 0 ORDER BY assortment_id DESC LIMIT 25";
        return database.query(sql, [studentClass]);
    }

    // getCategoryListByExams, examList
    static getCategoryList(database, categoryList) {
        // 5 ms
        const sql = 'SELECT exam, category FROM `exam_category_mapping` WHERE exam IN (?)';
        return database.query(sql, [categoryList]);
    }

    // static getSubjectWiseTeacher(database, subject) {
    //     // 2 ms
    //     // lots of teachers' images links are not working, so we are taking only first 5 teachers.
    //     const sql = 'SELECT subject, image_url FROM `dashboard_users` WHERE `subject` = ? AND is_active = 1 AND image_url IS NOT NULL AND image_url <> "" LIMIT 5';
    //     return database.query(sql, [subject]);
    // }

    static getSubjectWiseTeacherFromCourseTeacherMapping(database, subject) {
        // 2 ms
        // lots of teachers' images links are not working, so we are taking only first 5 teachers.
        const sql = 'SELECT subject, image_url FROM `course_teacher_mapping` WHERE `subject` = ? AND image_url IS NOT NULL AND image_url <> "" LIMIT 5';
        return database.query(sql, [subject]);
    }

    static getJeeMainsAndAdvCarshCourse(database, courseId) {
        const sql = `select distinct
            q.question_id AS resource_reference,q.ocr_text,q.doubt,q.question, q.chapter,NULL as subtopic,
            q.class,NULL as packages,
            lcd.live_at,lcd.subject,lcd.master_chapter,lcd.faculty_id,aa.duration,cdlcm.assortment_id, lcd.is_free,
            c.display,c.expert_name,c.subject,c.stream_status,c.meta_info,c.player_type,c.chapter,c.expert_image,cd.category, c.old_detail_id
            from classzoo1.course_details_liveclass_course_mapping cdlcm
            left join classzoo1.liveclass_course_details lcd on cdlcm.liveclass_course_id = lcd.liveclass_course_id
            left join classzoo1.liveclass_course_resources cs on cs.liveclass_course_detail_id = lcd.id
            left join classzoo1.questions q on q.question_id = cs.resource_reference
            left join classzoo1.answers aa on aa.question_id =  q.question_id
            left join classzoo1.course_resources c on c.resource_reference = cs.resource_reference
            left join classzoo1.course_details cd  on cd.assortment_id =  cdlcm.assortment_id
            where  cs.resource_type in (1,4,8)
            and lcd.subject not in ('ALL','ANNOUNCEMENT','GUIDANCE')
            and c.player_type = 'livevideo'
            and lcd.live_at <= date_add(CURRENT_TIMESTAMP, interval 2 HOUR)
            and cdlcm.liveclass_course_id  = ?
            ORDER BY lcd.live_at DESC ,resource_reference DESC
            limit 10`;
        return database.query(sql, [courseId]);
    }

    static getLiveVideoDetailsWithTeacherByResId(database, liveVideoId) {
        const sql = 'SELECT g.*, h.image_bg_liveclass, h.image_url FROM (SELECT e.*, MAX(f.answer_id) AS answer_id, f.duration FROM (SELECT c.*, d.is_active, d.is_free, d.category FROM (SELECT a.id AS resource_id, a.resource_reference, a.resource_type, a.subject, a.topic, a.faculty_id, a.expert_name, a.expert_image, a.class, a.player_type, a.stream_status, a.chapter, a.name, a.display, a.meta_info, a.description, b.live_at, UNIX_TIMESTAMP(b.live_at)*1000 AS live_at_timestamp, b.assortment_id FROM course_resources AS a LEFT JOIN course_resource_mapping AS b ON a.id = b.course_resource_id WHERE a.resource_reference = ?) AS c LEFT JOIN course_details AS d ON c.assortment_id = d.assortment_id WHERE d.is_free = 1 AND d.is_active = 1) AS e LEFT JOIN answers AS f ON e.resource_reference = f.question_id ORDER BY e.resource_id DESC LIMIT 1) AS g LEFT JOIN dashboard_users AS h ON g.faculty_id = h.id';
        return database.query(sql, [liveVideoId]);
    }

    static getYoutubeEvents(db, page, limit) {
        const sql = `SELECT ye.*, cr.subject, cr.topic from youtube_event ye
        left join course_resources cr on cr.resource_reference = ye.resource_reference
        where ye.live_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR) and ye.is_active = 1 and ye.is_deleted = 0
        group by ye.id order by ye.live_at asc limit ? offset ?`;

        return db.query(sql, [limit, limit * page]);
    }

    static updateYoutubeEventsMeta(db, eventId, title, description) {
        const sql = 'update youtube_event set title = ?, description = ? where id = ?';
        return db.query(sql, [title, description, eventId]);
    }

    static getYoutubeVideoByEvent(db, eventId) {
        const sql = 'SELECT * from youtube_channel_event_map ycem left join youtube_channel yc on ycem.channel_id = yc.id where ycem.event_id = ?';
        return db.query(sql, [eventId]);
    }

    static getYoutubeChannels(db) {
        const sql = 'SELECT * from youtube_channel';
        return db.query(sql);
    }

    static getYoutubeEventById(db, eventId) {
        const sql = 'SELECT * from youtube_event where id = ?  and is_active = 1 and is_deleted = 0';
        return db.query(sql, [eventId]);
    }

    static updateEventState(db, eventId, isProcessed) {
        const sql = 'update youtube_event set is_processed = ? where id = ?';
        return db.query(sql, [isProcessed, eventId]);
    }

    static insertVideoEvent(db, eventId, channelId) {
        const sql = 'insert ignore into youtube_channel_event_map set event_id = ?, channel_id = ?';
        return db.query(sql, [eventId, channelId]);
    }

    static getResourceByAssortmentId(db, assortmentId) {
        const sql = 'select course_resource_id, resource_reference from course_resource_mapping crm left join course_resources cr on crm.course_resource_id = cr.id where assortment_id = ? and crm.resource_type = "resource"';
        return db.query(sql, [assortmentId]);
    }

    static getOldResourceId(db, assortmentId) {
        const sql = 'select old_resource_id from course_resource_mapping where assortment_id = ?';
        return db.query(sql, [assortmentId]);
    }

    static getFacultyImgById(database, facultyId) {
        const sql = 'SELECT id, image_bg_liveclass, image_url FROM dashboard_users WHERE id = ?';
        return database.query(sql, [facultyId]);
    }
};
// 1 = video
// 2 = notes
// 3 = assignment
// 4 = stream
// 5 = mock test
// 6 = doubts
// 7 = quiz
// 8 = recorded vod
// 9 = mock test show on detail screen
