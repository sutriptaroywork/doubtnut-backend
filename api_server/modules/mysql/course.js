const _ = require('lodash');
const Utility = require('../utility');
const Data = require('../../data/data');
const config = require('../config');

module.exports = class Course {
    static getFacultyDetails(db, faculty_id) {
        const sql = `SELECT id, short_description, description, name, nickname, raw_image_url, square_image_url, demo_image_url, demo_qid, CONCAT('${Data.etoos_questions_prefix}',demo_qid,'.png') as video_thumbnail, degree_obtained, college, years_experience, coaching  from etoos_faculty WHERE id=?`;
        return db.query(sql, [faculty_id]);
    }

    static getChapterDetails(db, faculty_id, ecm_id) {
        const sql = 'SELECT *, REPLACE(THUMBNAIL,\'/chapter/\',\'/chapter/square-\') as square_thumbnail from etoos_chapter WHERE faculty_id=? and ecm_id=?';
        return db.query(sql, [faculty_id, ecm_id]);
    }

    static getChapterDetailsV2(db, facultyId, ecmId) {
        const sql = 'select * from (SELECT * from etoos_chapter WHERE faculty_id=? and ecm_id=?) a left join (select count(*) as lecture_count, chapter_id,faculty_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as b on a.id=b.chapter_id and a.faculty_id=b.faculty_id';
        console.log(sql);
        return db.query(sql, [facultyId, ecmId]);
    }

    static getLiveSectionVideos(db, ecmId, studentClass, subject) {
        let sql;
        if (subject != 0 && subject != 1) {
            sql = `select a.id as detail_id,c.player_type, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name, a.master_chapter, d.id as faculty_id, c.resource_type, a.liveclass_course_id, f.is_free from
            (select * from liveclass_course where ecm_id=${ecmId} and class='${studentClass}' and course_type='course') as f join
            (select * from liveclass_course_details where is_free=1 and live_at >= CURDATE() and subject='${subject}') as a on a.liveclass_course_id=f.id left join
            (select * from liveclass_stream where is_active!=0) as b on a.id=b.detail_id left join
            (select * from liveclass_course_resources where resource_type=4 or resource_type=1) as c on a.id=c.liveclass_course_detail_id left join
            (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join
            (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on e.faculty_id=d.id order by a.live_at asc`;
        } else if (subject === 0) {
            sql = `select a.id as detail_id,c.player_type, c.resource_reference as id,a.live_at, b.start_time,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,b.is_active,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name, a.master_chapter, d.id as faculty_id, c.resource_type, a.liveclass_course_id, f.is_free from
            (select * from liveclass_course where ecm_id=${ecmId} and class='${studentClass}' and course_type='course') as f join
            (select * from liveclass_course_details where is_free=1 and live_at >= CURDATE()) as a on a.liveclass_course_id=f.id left join
            (select * from liveclass_stream where is_active!=0) as b on a.id=b.detail_id left join
            (select * from liveclass_course_resources where resource_type=4 or resource_type=1) as c on a.id=c.liveclass_course_detail_id left join
            (select * from liveclass_detail_faculty_mapping) as e on a.id=e.detail_id left join
            (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on e.faculty_id=d.id order by a.live_at asc`;
        }
        console.log(sql);
        return db.query(sql);
    }

    static getPromoSection(database, ecmId) {
        const sql = `select a.id as detail_id, c.resource_reference as id,a.live_at,case when d.image_bg_liveclass is NULL then c.expert_image else d.image_bg_liveclass end as image_bg_liveclass,a.subject,c.topic, case when d.faculty_name is NULL then c.expert_name else d.faculty_name end as faculty_name, a.master_chapter, d.id as faculty_id, a.chapter, c.player_type, c.resource_type,e.duration from (select * from liveclass_course where course_type = 'promo' and ecm_id =?) as b left join
        (select * from liveclass_course_details) as a on a.liveclass_course_id=b.id inner join (select * from liveclass_course_resources where resource_type in (1,4,8)) as c on a.id=c.liveclass_course_detail_id left join (select name as faculty_name, id,raw_image_url as image_bg_liveclass from etoos_faculty) as d on a.faculty_id=d.id left join (select duration,question_id from answers) as e on e.question_id=c.resource_reference order by a.live_at asc; `;
        console.log(sql);
        return database.query(sql, [ecmId]);
    }

    static getAllMasterChapters(db, ecmId, subject) {
        // const sql = `Select b.master_chapter as title,count(e.answer_id) as number_of_videos,sum(e.duration) as duration, b.subject,b.liveclass_course_id as ecm_id, min(b.id) as id
        // from liveclass_course_details as b
        // left join liveclass_course_resources as c on b.id=c.liveclass_course_detail_id
        // left join answers as e on c.resource_reference=e.question_id
        // left join liveclass_course as d on b.liveclass_course_id=d.id
        // where d.ecm_id =${ecmId} and b.subject='${subject}' and d.course_type='course'
        // group by b.master_chapter,b.subject,b.liveclass_course_id`;
        let sql;
        if (subject) {
            sql = `Select b.master_chapter as title,count(e.answer_id) as number_of_videos,sum(e.duration) as duration, b.subject,d.ecm_id, min(b.id) as id from liveclass_course_details as b left join liveclass_course_resources as c on b.id=c.liveclass_course_detail_id left join (select * from answers where question_id !=0) as e on  c.resource_reference=e.question_id left join liveclass_course as d on b.liveclass_course_id=d.id where d.ecm_id =${ecmId} and d.course_type<>'vod' and c.resource_type in (1,4,8) and b.subject='${subject}' group by b.master_chapter,b.subject,d.ecm_id having count(e.answer_id)>0`;
        } else {
            sql = `Select b.master_chapter as title,count(e.answer_id) as number_of_videos,sum(e.duration) as duration, b.subject,d.ecm_id, min(b.id) as id from liveclass_course_details as b left join liveclass_course_resources as c on b.id=c.liveclass_course_detail_id left join (select * from answers where question_id !=0) as e on  c.resource_reference=e.question_id left join liveclass_course as d on b.liveclass_course_id=d.id where d.ecm_id =${ecmId} and d.course_type<>'vod' and c.resource_type in (1,4,8) group by b.master_chapter,b.subject,d.ecm_id having count(e.answer_id)>0`;
        }

        console.log(sql);
        return db.query(sql);
    }

    static getAllMasterChaptersEtoos(db, ecmId, studentClass, subject) {
        let sql;
        if (subject) {
            sql = `select duration,lecture_count as number_of_videos,name as title,subject, a.ecm_id,a.id from ((SELECT * from etoos_chapter WHERE ecm_id=${ecmId} and class=${studentClass} and subject='${subject}' and class IS NOT NULL) a left join (select count(*) as lecture_count, chapter_id,faculty_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as b on a.id=b.chapter_id and a.faculty_id=b.faculty_id) group by title having number_of_videos>0;`;
        } else {
            sql = `select duration,lecture_count as number_of_videos,name as title,subject, a.ecm_id,a.id from ((SELECT * from etoos_chapter WHERE ecm_id=${ecmId} and class=${studentClass} and class IS NOT NULL) a left join (select count(*) as lecture_count, chapter_id,faculty_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as b on a.id=b.chapter_id and a.faculty_id=b.faculty_id) group by title having number_of_videos>0;`;
        }

        console.log(sql);
        return db.query(sql);
    }

    static getAllMasterChaptersEtoosV1(db, ecmId, studentClass, subject) {
        let sql;
        if (subject === 'ALL') {
            sql = `select duration,lecture_count,name as chapter,subject, a.ecm_id,a.id as detail_id,faculty_name,degree from ((SELECT * from etoos_chapter WHERE ecm_id=${ecmId} and class=${studentClass} and class IS NOT NULL) a left join (select count(*) as lecture_count, chapter_id,faculty_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as b on a.id=b.chapter_id and a.faculty_id=b.faculty_id left join (select id,name as faculty_name, degree_obtained as degree from etoos_faculty) as c on a.faculty_id=c.id) group by chapter having lecture_count>0;`;
        } else {
            sql = `select duration,lecture_count,name as chapter,subject, a.ecm_id,a.id as detail_id,faculty_name,degree from ((SELECT * from etoos_chapter WHERE ecm_id=${ecmId} and class=${studentClass} and subject='${subject}' and class IS NOT NULL) a left join (select count(*) as lecture_count, chapter_id,faculty_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as b on a.id=b.chapter_id and a.faculty_id=b.faculty_id left join (select id,name as faculty_name, degree_obtained as degree from etoos_faculty) as c on a.faculty_id=c.id) group by chapter having lecture_count>0;`;
        }
        console.log(sql);
        return db.query(sql);
    }

    static getChapterDetailsUsingChapterId(db, chapterId) {
        const sql = `SELECT * from etoos_chapter WHERE id='${chapterId}'`;
        return db.query(sql);
    }

    static getCaraousels(database, ecmId, locale, page, limit, studentClass) {
        const sql = `select * from etoos_course_caraousel where ecm_id = ${ecmId} and locale='${locale}' and mapped_class = ${studentClass} and max_version_code < 695 and is_active=1 order by caraousel_order asc LIMIT ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getCaraouselsWithAppVersionCode(database, ecmId, locale, page, limit, studentClass, versionCode) {
        const sql = `select * from etoos_course_caraousel where min_version_code <= ${versionCode} and max_version_code > ${versionCode} and is_active=1 and show_home=0 order by caraousel_order asc LIMIT ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getCaraouselsWithAppVersionCodeFixed(database, ecmId, locale, page, limit, studentClass, versionCode) {
        const sql = `select * from etoos_course_caraousel where min_version_code <= ${versionCode} and max_version_code > ${versionCode} and is_active=1 and show_home=0 order by caraousel_order asc LIMIT ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getDfcData(data) {
        const {
            database,
            ecmId,
            limit,
            studentClass,
        } = data;
        const sql = `select b.question_id as id,b.name as title,b.thumbnail as image_url,a.lecture_id as lecture_id from (SELECT lecture_id FROM etoos_doubtnut_free_classes where date=CURDATE() and ecm_id=${ecmId} and is_active=1 and mapped_class=${studentClass} order by edfc_order asc limit ${limit}) as a left join (select name,id,thumbnail,question_id from etoos_lecture where is_active=1) as b on a.lecture_id=b.id`;
        // const sql = `select b.question_id as id,a.lecture_id,b.name as title,b.thumbnail as image_url from (SELECT lecture_id FROM etoos_doubtnut_free_classes where date='2020-03-15' and ecm_id=${ecmId} and is_active=1 order by edfc_order asc limit ${limit}) as a left join (select name,id,thumbnail,question_id from etoos_lecture where is_active=1) as b on a.lecture_id=b.id`;
        console.log(sql);
        return database.query(sql);
    }

    static getFacultyDetailsUsingChapterId(db, chapterId) {
        const sql = `SELECT id, description, name, raw_image_url, demo_qid, CONCAT('${Data.etoos_questions_prefix}',demo_qid,'.png') as video_thumbnail from etoos_faculty where id in (SELECT faculty_id FROM  etoos_lecture WHERE chapter_id='${chapterId}')`;
        return db.query(sql);
    }

    static getFacultyDetailsUsingChapterIdV2(db, chapterId, studentClass) {
        // const sql = `SELECT id, description, name, raw_image_url, demo_qid, CONCAT('${Data.etoos_questions_prefix}',demo_qid,'.png') as video_thumbnail from etoos_faculty where id in (SELECT faculty_id FROM  etoos_lecture WHERE chapter_id='${chapterId}')`;
        const sql = `select b.id, b.description, b.name, b.demo_image_url as image_url, CONCAT('${Data.etoos_questions_prefix}',demo_qid,'.png') as video_thumbnail, a.faculty_id, c.display_name as course, b.demo_qid from (SELECT faculty_id, ecm_id FROM etoos_chapter WHERE id=${chapterId}) as a left join (select id, description, name, demo_image_url, demo_qid from etoos_faculty) as b on a.faculty_id=b.id left join (select * from etoos_course_mapping where class=${studentClass} and is_active=1) as c on a.ecm_id=c.id`;
        console.log(sql);
        return db.query(sql);
    }

    static getFacultyDetailsUsingChapterIdV3(db, chapterId, studentClass) {
        const sql = `select b.id, b.description, b.name as mapped_faculty_name, b.demo_image_url as image_bg_liveclass, a.subject, c.class, CONCAT('${Data.etoos_questions_prefix}',demo_qid,'.png') as video_thumbnail, a.faculty_id, c.display_name as course, b.demo_qid as resource_reference, a.name as chapter from (SELECT * FROM etoos_chapter WHERE id=${chapterId})as a left join (select id, description, name, demo_image_url, demo_qid from etoos_faculty) as b on a.faculty_id=b.id left join (select * from etoos_course_mapping where class=${studentClass} and is_active=1) as c on a.ecm_id=c.id`;
        console.log(sql);
        return db.query(sql);
    }

    static getEtoosChapterListByChapterid(db, chapterId, limit) {
        const sql = `Select id,name as title,subject as subtitle,thumbnail as image_url from etoos_chapter where id in (${chapterId}) order by c_order limit ${limit}`;
        return db.query(sql);
    }

    static getLectures(db, chapterId) {
        const sql = `SELECT a.id as lecture_id, a.name, a.chapter_id as id, a.thumbnail, a.question_id, b.duration from  (SELECT *  from  etoos_lecture where chapter_id='${chapterId}') as a left join (select * from answers) as b on a.question_id = b.question_id group by b.question_id order by a.l_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getRelatedLectures(db, chapterId) {
        const sql = `SELECT a.id as lecture_id, a.name as chapter, a.chapter_id as id, a.question_id, b.duration, c.name as mapped_faculty_name, c.degree_obtained from (SELECT *  from  etoos_lecture where chapter_id='${chapterId}') as a left join (select id, description, name, demo_image_url, degree_obtained from etoos_faculty) as c on a.faculty_id=c.id left join (select * from answers) as b on a.question_id = b.question_id group by b.question_id order by a.l_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getTopTeachersMeta(db, facultyArray, ecmId, limit) {
        const sql = `SELECT id as faculty_id, ${ecmId} as ecm_id,name as title, degree_obtained, college, coaching, years_experience,square_image_url as image_url, subject, case when subject='PHYSICS' then '#005B6B' when subject='CHEMISTRY' then '#AA0070' when subject='MATHS' then '#103E7E' when subject='BIOLOGY' then '#007141' else '#AA0070' end as background_color from  etoos_faculty where id in (${facultyArray}) limit ${limit}`;
        console.log(sql);
        return db.query(sql);
    }

    static getTeacherChapters(db, facultyId, ecmId, limit) {
        const sql = `SELECT id,name as title,subject as subtitle,REPLACE(THUMBNAIL,'/chapter/','/chapter/square-') as image_url from  etoos_chapter where faculty_id in (${facultyId}) and ecm_id = ${ecmId} order by c_order asc limit ${limit}`;
        return db.query(sql);
    }

    static getEcmListData(db, studentClass) {
        const sql = `SELECT id as filter_id, display_name as text from  etoos_course_mapping where class = ${studentClass} and is_active=1 order by ecm_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getEcmListDataV2(db, studentClass) {
        const sql = `SELECT id as 'key', display_name as value from  etoos_course_mapping where class = ${studentClass} and is_active = 1 order by ecm_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getEcmListDataV3(db, studentClass) {
        const sql = `Select distinct(ecm_id) as filter_id, ecm_display as text from liveclass_course where class=${studentClass} order by course_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getEcmListDataV4(db, studentClass) {
        const sql = `Select distinct(ecm_id) as filter_id, ecm_display as text from liveclass_course where class=${studentClass} and is_live=0 order by course_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getDistinctCourseTypes(db, ecmId) {
        const sql = `Select distinct(course_type) as course_type from liveclass_course where ecm_id=${ecmId} order by course_order asc`;
        console.log(sql);
        return db.query(sql);
    }

    static getLecturesList(db, chapterId, limit) {
        const sql = `SELECT question_id as id ,id as lecture_id, name as title, null as subtitle, thumbnail as image_url from  etoos_lecture where is_active=1 and chapter_id in (${chapterId}) order by l_order asc limit ${limit}`;
        return db.query(sql);
    }

    static checkVip(db, student_id) {
        const sql = 'select *, DATEDIFF(end_date, CURRENT_DATE) as diff  from student_package_subscription where student_id = ? and start_date <= CURRENT_DATE and end_date >= CURRENT_DATE and is_active=1 order by id DESC LIMIT 1';
        // console.log(sql);
        return db.query(sql, [student_id]);
    }

    static checkVipV1(db, student_id) {
        const sql = 'select * from (select *, DATEDIFF(end_date, CURRENT_DATE) as diff  from student_package_subscription where student_id = ? and start_date <= CURRENT_DATE and end_date >= CURRENT_DATE and is_active=1) as a left join student_package as b on a.student_package_id = b.id left join student_master_package as c on c.id= b.subcategory_id order by a.id;';
        // console.log(sql);
        return db.query(sql, [student_id]);
    }

    static getUserSubscription(db, studentID) {
        const sql = `select *, a.is_active as sub_active,b.id as package_id from (select * from student_package_subscription where student_id = ${studentID}) as a inner join student_package as b on a.student_package_id = b.id inner join student_master_package as c on c.id= b.subcategory_id order by a.id`;
        console.log(sql);
        return db.query(sql);
    }

    static getUserSubscriptionByVariantId(db, studentID) {
        const sql = 'select *, a.id as sub_id from (select * from student_package_subscription where student_id = ? and end_date>= CURRENT_DATE and is_active=1) as a left join package as c on c.id= a.new_package_id left join variants as b on a.variant_id = b.id  order by a.id';
        return db.query(sql, [studentID]);
    }

    static getEcmByPackageId(db, packageId, ecmId, studentClass, type) {
        const sql = `select * from liveclass_course where package_id = ${packageId} and ecm_id = ${ecmId} and class=${studentClass} and course_type='${type}';`;
        console.log(sql);
        return db.query(sql);
    }

    static getCourseByEcmId(db, ecmId, studentClass, type) {
        const sql = `select id from liveclass_course where ecm_id= ${ecmId} and class= ${studentClass} and course_type='${type}';`;
        console.log(sql);
        return db.query(sql);
    }

    static getByEcmIdAndType(db, ecmId, type) {
        const sql = `select b.category_id from (select * from liveclass_course where ecm_id= ${ecmId} and course_type='${type}') as a left join student_master_package as b on a.category_id=b.id;`;
        console.log(sql);
        return db.query(sql);
    }

    static checkVipWithExpiry(db, studentId) {
        const sql = 'select a.*,b.name from (select *, DATEDIFF(end_date, CURRENT_DATE) as diff  from student_package_subscription where student_id = ?) as a inner join (select * from package where reference_type in (\'default\', \'v3\', \'onlyPanel\')) as b on a.new_package_id=b.id order by a.id DESC';
        // console.log(sql);
        return db.query(sql, [studentId]);
    }

    static getTopFacultyFromLectureId(db, lecture_id) {
        const sql = `Select d.square_image_url,d.nickname  from (select chapter_id from etoos_lecture where id = '${lecture_id}') as a left join etoos_chapter as b on a.chapter_id = b.id left join etoos_faculty_course as c on b.ecm_id=c.ecm_id left join etoos_faculty as d on c.faculty_id=d.id order by d.ranking desc limit 3`;
        return db.query(sql);
    }

    static checkForDemo(db, question_id) {
        const sql = 'Select * from (Select DISTINCT(demo_qid) as question_id from etoos_faculty UNION (SELECT etoos_lecture.question_id FROM etoos_doubtnut_free_classes left join etoos_lecture on etoos_doubtnut_free_classes.lecture_id=etoos_lecture.id) UNION SELECT resource_reference FROM etoos_structured_course_resources WHERE resource_type =0) as a where a.question_id = ?';
        return db.query(sql, [question_id]);
    }

    static getLectureIdFromQuestionId(db, question_id) {
        const sql = 'SELECT * FROM etoos_lecture WHERE question_id = ? limit 1';
        console.log(sql);
        return db.query(sql, [question_id]);
    }

    static getEResourcesFromChapterId(db, chapterId) {
        const sql = `SELECT id, chapter_id, resource_type, resource_name, resource_location, 'VIEW NOW' as btn_text, '${config.staticCDN}images/notes-pdf-icon.png' as icon_url FROM etoos_lecture_reference WHERE chapter_id = ${chapterId} and resource_type='NOTES'`;
        return db.query(sql);
    }

    static getEResourcesFromChapterIdV1(db, chapterId) {
        const sql = `Select *,b.name as master_chapter,CONCAT(a.resource_name,' - ',b.name) as topic from (SELECT id as resource_reference, chapter_id, resource_type, resource_name, resource_location, 'VIEW NOW' as btn_text, '${config.staticCDN}images/notes-pdf-icon.png' as icon_url FROM etoos_lecture_reference WHERE chapter_id = ${chapterId} and resource_type='NOTES') as a left join etoos_chapter as b on a.chapter_id=b.id`;
        return db.query(sql);
    }

    static isEtoosQuestionGet(database, questionId) {
        const sql = `SELECT question_id FROM etoos_lecture where question_id = ${questionId}`;
        return database.query(sql);
    }

    static getEcmByIdAndClass(database, ecmId, studentClass) {
        const sql = `SELECT display_name,course FROM etoos_course_mapping where id = ${ecmId} and class = ${parseInt(studentClass)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getFacultyGrid(database, ecmId, studentClass) {
        const sql = `Select a.faculty_id as id, c.college, c.degree_obtained, c.years_experience,c.home_image_url as image_url, c.demo_qid as question_id, c.name as title,c.subject, b.display_name as course, a.ecm_id from ( SELECT * FROM etoos_faculty_course) as a left join etoos_course_mapping as b on a.ecm_id = b.id left join etoos_faculty as c on a.faculty_id = c.id where b.class = ${studentClass} and b.id=${ecmId}`;
        console.log(sql);
        return database.query(sql);
    }

    static getFacultyGridBySubject(database, ecmId, studentClass, subject) {
        let sql = `Select a.faculty_id as id, c.college, c.degree_obtained, c.years_experience,c.home_image_url as image_url, c.demo_qid as question_id, c.name as title,c.subject, b.display_name as course, a.ecm_id from ( SELECT * FROM etoos_faculty_course) as a left join etoos_course_mapping as b on a.ecm_id = b.id left join etoos_faculty as c on a.faculty_id = c.id where b.class = ${studentClass} and b.id=${ecmId}`;
        if (subject !== 0) {
            sql = `Select a.faculty_id as id, c.college, c.degree_obtained, c.years_experience,c.home_image_url as image_url, c.demo_qid as question_id, c.name as title,c.subject, b.display_name as course, a.ecm_id from ( SELECT * FROM etoos_faculty_course) as a left join etoos_course_mapping as b on a.ecm_id = b.id left join etoos_faculty as c on a.faculty_id = c.id where b.class = ${studentClass} and b.id=${ecmId} and c.subject='${subject}'`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getSubjectList(database, ecmId, studentClass) {
        const sql = `select DISTINCT(subject) from (select subject,ecm_id from etoos_chapter where ecm_id =${ecmId})as a left join  etoos_course_mapping as b on a.ecm_id=b.id and b.class=${studentClass};`;
        console.log(sql);
        return database.query(sql);
    }

    static getTopCourses(database, ecmId, studentClass) {
        // const sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' - ', d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url, a.id as ecm_id from (select id,display_name from etoos_course_mapping where id=${ecmId} and class=${studentClass}) as a left join (select name,id, faculty_id,ecm_id,subject, top_course_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id order by rand() limit 7`;
        const sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' -' , d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (SELECT * from etoos_faculty_course where ecm_id=${ecmId}) as t1 left join (select id,display_name from etoos_course_mapping where id=${ecmId} and class = ${studentClass}) as a on t1.ecm_id=a.id left join (select name,id, faculty_id,ecm_id,subject,popular_course_order from etoos_chapter) as b on t1.ecm_id=b.ecm_id and t1.faculty_id=b.faculty_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id) as d on b.id=d.chapter_id order by rand() limit 7`;
        console.log(sql);
        return database.query(sql);
    }

    static getPopularCourses(database, ecmId, studentClass) {
        // const sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' -' , d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (select id,display_name from etoos_course_mapping where id=${ecmId} and class=${studentClass}) as a left join (select name,id, faculty_id,ecm_id,subject,popular_course_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id order by rand() limit 7`;

        const sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' -' , d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (SELECT * from etoos_faculty_course where ecm_id=${ecmId}) as t1 left join (select id,display_name from etoos_course_mapping where id=${ecmId} and class = ${studentClass}) as a on t1.ecm_id=a.id left join (select name,id, faculty_id,ecm_id,subject,popular_course_order from etoos_chapter) as b on t1.ecm_id=b.ecm_id and t1.faculty_id=b.faculty_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id) as d on b.id=d.chapter_id order by rand() limit 7`;
        console.log(sql);
        return database.query(sql);
    }

    static getCourseList(database, ecmId, studentClass, subject, page) {
        const limit = 10;
        let sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' - ', d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (select id,display_name from etoos_course_mapping where class=${studentClass} and is_active=1) as a left join (select name,id, faculty_id,ecm_id,subject,c_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id order by rand() limit ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        if (!_.isNil(ecmId) && (ecmId !== '0')) {
            sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' - ', d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (select id,display_name from etoos_course_mapping where id=${ecmId} and class=${studentClass}) as a left join (select name,id, faculty_id,ecm_id,subject,c_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id order by rand() limit ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        }
        if (!_.isNil(subject) && (subject !== '0')) {
            sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' - ', d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (select id,display_name from etoos_course_mapping where class=${studentClass} and is_active=1) as a left join (select name,id, faculty_id,ecm_id,subject,c_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id  where b.subject = '${subject}' order by rand() limit ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        }
        if ((!_.isNil(ecmId) && (ecmId !== '0')) && (!_.isNil(subject) && (subject !== '0'))) {
            sql = `select b.id as id,b.faculty_id, CONCAT(c.name,' - ', b.subject, ' - ', a.display_name) as title, c.name as bottom_title,b.name as image_title,b.subject, a.display_name as course, CONCAT(b.subject, ' - ', d.video_count,' videos') as image_subtitle, d.duration as image_duration, d.video_count, c.raw_image_url as image_url,a.id as ecm_id from (select id,display_name from etoos_course_mapping where id=${ecmId} and class=${studentClass}) as a left join (select name,id, faculty_id,ecm_id,subject,c_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id  where b.subject = '${subject}' order by rand() limit ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getDistinctSubject(database, ecmId, studentClass) {
        const sql = 'select b.subject from (select id,display_name from etoos_course_mapping where id=? and class=? and is_active=1) as a left join (select name,id, faculty_id,ecm_id,subject,c_order from etoos_chapter) as b on a.id=b.ecm_id left join (select id, name, raw_image_url from etoos_faculty ) as c on c.id=b.faculty_id left join (select count(*) as video_count, chapter_id, sum(duration) as duration from etoos_lecture group by chapter_id, faculty_id ) as d on b.id=d.chapter_id group by b.subject';
        console.log(sql);
        return database.query(sql, [ecmId, studentClass]);
    }

    static getStructuredFreeCourse(database, ecmId, studentClass) {
        const sql = 'Select b.id as id, b.title as image_subtitle,count(c.resource_reference) as video_count, case when sum(d.duration) is null then 855000 else sum(d.duration) end as image_duration, b.logo as image_url, a.display_name as course from (Select * from etoos_course_mapping where class = ? and id = ?) as a inner join (SELECT * FROM etoos_structured_course) as b on a.id = b.ecm_id left join (Select * from etoos_structured_course_resources where resource_type = 0) as c on b.id = c.structured_course_id left join (select question_id, duration from etoos_lecture) as d on c.resource_reference = d.question_id group by a.class, a.id, b.title, b.id order by b.course_order asc';
        console.log(sql);
        return database.query(sql, [studentClass, ecmId]);
    }

    static getAllStructuredCourse(database, ecmId, studentClass, subject) {
        let sql;
        if (subject == 'ALL') {
            // const sql = `Select b.id as id, b.title as image_title, c.subject as subject, b.logo as image_url, a.display_name as course from (Select * from etoos_course_mapping where class = ${studentClass} and id = ${ecmId}) as a inner join (SELECT * FROM etoos_structured_course) as b on a.id = b.ecm_id left join (Select * from etoos_structured_course_resources where resource_type = 0) as c on b.id = c.structured_course_id left join (select question_id, duration from etoos_lecture) as d on c.resource_reference = d.question_id group by a.class, a.id, b.title, b.id order by b.course_order asc`;
            sql = `Select title as image_title,logo as icon_url,banner as image_bg, description as image_subtitle,id ,faculty_avatars,image_title as bottom_title,bottom_subtitle,is_live, banner from liveclass_course where ecm_id=${ecmId} and course_type='course' and class=${studentClass} and is_show in ('all') limit 5`;
        } else {
            sql = `Select b.display_name as image_title,a.id,a.subject from ((select * from liveclass_course_details where class=${studentClass} group by liveclass_course_id) as a left join liveclass_course as b on a.liveclass_course_id=b.id and b.ecm_id=${ecmId}) limit 5`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getAllStructuredCourseV2(database, ecmId, studentClass, subject) {
        let sql;
        if (subject == 'ALL') {
            // const sql = `Select b.id as id, b.title as image_title, c.subject as subject, b.logo as image_url, a.display_name as course from (Select * from etoos_course_mapping where class = ${studentClass} and id = ${ecmId}) as a inner join (SELECT * FROM etoos_structured_course) as b on a.id = b.ecm_id left join (Select * from etoos_structured_course_resources where resource_type = 0) as c on b.id = c.structured_course_id left join (select question_id, duration from etoos_lecture) as d on c.resource_reference = d.question_id group by a.class, a.id, b.title, b.id order by b.course_order asc`;
            sql = `Select title as image_title,logo as icon_url,banner as image_bg, description as image_subtitle,id ,faculty_avatars,image_title as bottom_title,bottom_subtitle,is_live, banner,is_free,category_id, course_type from liveclass_course where ecm_id in (${ecmId.join(',')}) and course_type='course' and class=${studentClass} and is_show in ('all', '1') order by course_order limit 5`;
        } else {
            sql = `Select b.display_name as image_title,a.id,a.subject from ((select * from liveclass_course_details where class=${studentClass} group by liveclass_course_id) as a inner join liveclass_course as b on a.liveclass_course_id=b.id and b.ecm_id=${ecmId}) limit 5`;
        }
        console.log(sql);
        return database.query(sql);
    }

    static getCoursesByFaculty(database, ecmId, studentClass, facultyId) {
        const sql = 'Select c.title as image_title,c.logo as icon_url, c.description as image_subtitle,c.id ,c.faculty_avatars,c.image_title as bottom_title,c.bottom_subtitle,c.is_live,b.id,b.subject, a.faculty_id from ((select * from liveclass_detail_faculty_mapping where faculty_id =?) as a left join liveclass_course_details as b on a.detail_id=b.id join liveclass_course as c on b.liveclass_course_id=c.id and c.ecm_id=? and c.course_type!=\'promo\') group by b.liveclass_course_id;';
        console.log(sql);
        return database.query(sql, [facultyId, ecmId]);
    }

    static getSyllabusByFaculty(database, ecmId, studentClass, facultyId) {
        const sql = 'Select  count(*) as number_of_videos,sum(e.duration) as duration,b.master_chapter as title,b.subject,d.ecm_id,c.id  as co , b.id , e.answer_id from ((select * from liveclass_detail_faculty_mapping where faculty_id =?) as a left join liveclass_course_details as b on a.detail_id=b.id left join liveclass_course_resources as c on b.id=c.liveclass_course_detail_id join answers as e on c.resource_reference=e.question_id left join liveclass_course as d on b.liveclass_course_id=d.id and d.ecm_id =? and d.course_type!=\'promo\') group by b.master_chapter';
        console.log(sql);
        return database.query(sql, [facultyId, ecmId]);
    }

    static getTestimonials(database) {
        const sql = 'select title, image_url, description, subtitle from etoos_testimonials where is_active=1 order by id asc';
        console.log(sql);
        return database.query(sql);
    }

    static getClassByEcmId(database, ecmId) {
        const sql = 'select distinct class from etoos_chapter where ecm_id=? and class is not null';
        console.log(sql);
        return database.query(sql, [ecmId]);
    }

    static getByChapterID(database, chapterID) {
        const sql = 'select * from (select ecm_id, id from etoos_chapter where id=?) as a left join (select * from liveclass_course) as b on a.ecm_id=b.ecm_id';
        console.log(sql);
        return database.query(sql, [chapterID]);
    }

    static getByEcmID(database, ecmID) {
        const sql = 'select * from liveclass_course where ecm_id=? limit 1';
        console.log(sql);
        return database.query(sql, [ecmID]);
    }

    static getEcmIdFromCcm(database, ccmArray, studentClass, studentId) {
        const sql = 'SELECT a.*,b.* from (SELECT ecm_id,assortment_id,min(carousel_order) as carousel_order FROM ccm_ecm_mapping WHERE ccm_id IN (?) and class =? group by ecm_id) as a left join liveclass_course as b on a.ecm_id = b.ecm_id left join (select assortment_id,id from package where id in (select new_package_id from student_package_subscription where student_id=? and is_active=1 and start_date<now())) as p on p.assortment_id=a.assortment_id where b.class = ? order by p.id desc, a.carousel_order';
        console.log(sql);
        return database.query(sql, [ccmArray, studentClass, studentId, studentClass]);
    }

    static getAssortmentIDFromCcm(database, ccmArray, studentClass, userLocale) {
        studentClass = parseInt(studentClass);
        const sql = 'SELECT a.assortment_id, b.display_name, b.is_free, e.title from (SELECT ecm_id,assortment_id,min(carousel_order) as carousel_order FROM ccm_ecm_mapping WHERE ccm_id IN (?) and class = ? group by ecm_id) as a inner join (select assortment_id,display_name,is_free from course_details where class = ? and is_active = 1) as b on a.assortment_id = b.assortment_id left join (select assortment_list,title from course_carousel where class=? and locale= ? and category is null and is_active=1) as e on CAST(a.assortment_id AS CHAR(5))=e.assortment_list order by a.carousel_order';
        console.log(sql);
        return database.query(sql, [ccmArray, studentClass, studentClass, studentClass, userLocale]);
    }

    static getEcmIdFromClass(database, studentClass, studentId) {
        const sql = 'select a.*,b.* from (select * from ccm_ecm_mapping where ccm_id is null and class=?) as a inner join (select * from liveclass_course where class=?) as b on a.ecm_id=b.ecm_id left join (select assortment_id,id from package where id in (select new_package_id from student_package_subscription where student_id=? and is_active=1 and start_date<now())) as p on p.assortment_id=a.assortment_id order by p.id desc, a.carousel_order';
        console.log(sql);
        return database.query(sql, [studentClass, studentClass, studentId]);
    }

    static getAssortmentIDFromClass(database, studentClass, userLocale) {
        studentClass = +(studentClass);
        const sql = 'select a.assortment_id, b.display_name, b.category, b.category_type, b.is_free, e.title from (select * from ccm_ecm_mapping where ccm_id is null and class=?) as a inner join (select assortment_id,display_name,is_free, category, category_type from course_details where class = ? and is_active = 1) as b on a.assortment_id = b.assortment_id left join (select assortment_list,title from course_carousel where class=? and locale= ? and category is null and is_active=1) as e on CAST(a.assortment_id AS CHAR(5))=e.assortment_list order by a.carousel_order';// 200 ms
        return database.query(sql, [studentClass, studentClass, studentClass, userLocale]);
    }

    static getDistinctCategoryFromClass(database, studentClass) {
        const sql = 'select DISTINCT(category_id) from liveclass_course where class=? and is_live=1';
        console.log(sql);
        return database.query(sql, [studentClass]);
    }

    static getDistinctCategoryIITFromClass(database, studentClass) {
        const sql = 'select DISTINCT(category_id) from liveclass_course where class=? and is_live=0';
        console.log(sql);
        return database.query(sql, [studentClass]);
    }

    static getFastestAnswer(database, studentID, date) {
        const sql = 'select created_at as fastest_time, student_id from liveclass_quiz_response where created_at >= ? and student_id = ? and is_correct=1 and is_live=1 order by created_at asc limit 1';
        console.log(sql);
        return database.query(sql, [date, studentID]);
    }

    static getTimetableImageByCourse(database, courseId) {
        const sql = 'select timetable from liveclass_course where id=?';
        console.log(sql);
        return database.query(sql, [courseId]);
    }

    static getScheduledClassesByFacultyId(database, facultyId) {
        // const sql = 'select * from (select * from course_resources where resource_type=4 and faculty_id= ? and stream_status is null ) as a left join (select assortment_id,course_resource_id,schedule_type,live_at,is_trial from course_resource_mapping where resource_type=\'RESOURCE\' and schedule_type=\'scheduled\') as b on a.id=b.course_resource_id where b.live_at IS NOT NULL';
        const sql = 'select * from (select * from course_resources where resource_type=4 and faculty_id= ? and stream_status is null ) as a left join (select assortment_id,course_resource_id,schedule_type,live_at,is_trial from course_resource_mapping where resource_type=\'RESOURCE\' and schedule_type=\'scheduled\') as b on a.id=b.course_resource_id where b.live_at IS NOT NULL and b.live_at >= date_add(CURRENT_TIMESTAMP,interval 1 DAY_HOUR) group by a.id, a.class,a.subject,a.resource_reference,a.resource_type,b.live_at,a.stream_push_url,a.old_detail_id,a.stream_status order by b.live_at asc';
        return database.query(sql, [facultyId]);
    }

    static getCourseResourceById(database, courseResourceId) {
        const sql = 'select * from course_resources where id= ?';
        return database.query(sql, [courseResourceId]);
    }

    static getCourseResourceMappingByCourseResourceId(database, courseResourceId) {
        const sql = 'select * from course_resource_mapping where course_resource_id = ? and resource_type="resource"';
        return database.query(sql, [courseResourceId]);
    }

    static insertCourseResource(database, courseResource) {
        const sql = 'insert into course_resources set ?';
        return database.query(sql, [courseResource]);
    }

    static insertOldCourseResource(database, courseResource) {
        const sql = 'insert into liveclass_course_resources set ?';
        return database.query(sql, [courseResource]);
    }

    static insertCourseResourceMapping(database, courseResourceMapping) {
        const sql = 'insert into course_resource_mapping set ?';
        return database.query(sql, courseResourceMapping);
    }

    static updateQuizResourceReference(database, courseResourceId, questionIds, metaInfo) {
        const sql = 'update course_resources set resource_reference = ?, meta_info = ? where id = ? and resource_type= 7';
        return database.query(sql, [questionIds, metaInfo, courseResourceId]);
    }

    static updateOldQuizResourceReference(database, courseResourceId, questionIds, metaInfo) {
        console.log(questionIds, metaInfo);
        const sql = 'update liveclass_course_resources set resource_reference = ?, meta_info = ? where id = ? and resource_type= 7';
        return database.query(sql, [questionIds, metaInfo, courseResourceId]);
    }

    static updateLiveClassCourseResourceMeta(database, courseResourceId, name, description, display) {
        const sql = 'update course_resources set name = ? ,display = ? , description = ? where id = ? and resource_type=4';
        return database.query(sql, [name, display, description, courseResourceId]);
    }

    static updateOldClassCourseResourceMeta(database, courseResourceId, name) {
        const sql = 'update liveclass_course_resources set topic = ? where id = (select old_resource_id from course_resources where id = ? ) and resource_type=4';
        return database.query(sql, [name, courseResourceId]);
    }

    static getTextSolutionsByQuestionId(database, questionIds) {
        console.log(questionIds);
        const sql = 'select * from text_solutions where question_id IN (?)';
        return database.query(sql, [questionIds]);
    }

    static getOldCourseResourceById(database, liveClassResourceId) {
        const sql = 'select * from liveclass_course_resources where id = ?';
        return database.query(sql, [liveClassResourceId]);
    }

    // UPCOMING CLASS APIs

    static getUpcomingScheduleByFacultyID(database, facultyID) {
        const sql = 'select * from course_schedule where faculty_id = ? AND is_processed = 0';
        return database.query(sql, [facultyID]);
    }

    static getMasterChaptersByCourseAndSubject(database, courseID, subject, pageNumber) {
        const pageSize = 100;
        const sql = 'select * from master_chapter_mapping where course_id = ? and subject= ? LIMIT ?  OFFSET ?';
        return database.query(sql, [courseID, subject, pageSize, pageNumber * pageSize]);
    }

    static updateUpcomingMeta(database, id, description, masterChapter, lectureID, lectureType) {
        const sql = 'update course_schedule set description = ?, master_chapter = ?, lecture_id = ?, lecture_type = ? where id = ?';
        return database.query(sql, [description, masterChapter, lectureID, lectureType, id]);
    }

    static getUpcomingClassDetails(database, courseScheduleId) {
        const sql = 'SELECT * FROM course_schedule where id =  ? and is_processed = 0';
        return database.query(sql, [courseScheduleId]);
    }

    static getPreviousClassesOfUpcomingClass(database, details) {
        const sql = 'SELECT * FROM liveclass_course_details where faculty_id = ? and liveclass_course_id = ? and master_chapter = ? and is_replay = 0';
        return database.query(sql, [details.faculty_id, details.liveclass_course_id, details.master_chapter]);
    }

    static insertUpcomingClassIntoCourseDetails(database, data, lectureNumber) {
        const sql = 'insert into liveclass_course_details SET liveclass_course_id=?, subject=?, chapter=?,class=?,live_at=?,is_free=?,master_chapter=?,course_type=?,faculty_id=?, lecture_type=?, batch_id = ?';
        return database.query(sql, [data.liveclass_course_id, data.subject, `${data.master_chapter} - ${lectureNumber}`, data.class, data.live_at, data.is_free, data.master_chapter, data.course_type, data.faculty_id, data.lecture_type, data.batch_id]);
    }

    static insertFacultyMapping(database, detail_id, faculty_id) {
        const sql = 'insert into liveclass_detail_faculty_mapping SET detail_id = ?, faculty_id = ? ';
        return database.query(sql, [detail_id, faculty_id]);
    }

    static insertStreamMapping(database, detail_id, faculty_id) {
        const sql = 'insert into liveclass_stream SET detail_id = ?, faculty_id = ?, is_active=0';
        return database.query(sql, [detail_id, faculty_id]);
    }

    static insertUpcomingClassIntoCourseResources(database, detailID, course, faculty, questionId, resource_type = 4, metaInfo = null) {
        const sql = 'insert into liveclass_course_resources SET liveclass_course_id=?,liveclass_course_detail_id=?, subject=?, topic=?,expert_name=?,expert_image=?,q_order=?,resource_type=?,resource_reference = ?,class=?,player_type=?,is_processed=?,is_resource_created=?,meta_info = ?,batch_id = ?, lecture_type = ?';
        return database.query(sql, [course.liveclass_course_id, detailID, course.subject, course.description.replace(/#!#/g, '|'), faculty.name, faculty.image_bg_liveclass, 1, resource_type, questionId, course.class, 'liveclass', 0, 0, metaInfo, course.batch_id, course.lecture_type]);
    }

    static updateUpcomingWithScheduled(database, courseScheduleId, courseDetailId) {
        const sql = 'update course_schedule set course_detail_id = ?, is_processed = ?, resource_created=?  where id = ?';
        return database.query(sql, [courseDetailId, 1, 1, courseScheduleId]);
    }

    static updateOcrTextByResourceID(database, resourceID, ocr_text) {
        const sql = 'UPDATE questions set ocr_text = ? and original_ocr_text = ? where question_id = (select resource_reference from course_resources where id = ?)';
        return database.query(sql, [resourceID, ocr_text, ocr_text]);
    }

    static getLiveClassCourseDataById(database, courseID) {
        const sql = 'SELECT * from liveclass_course where id = ?';
        return database.query(sql, [courseID]);
    }

    static updateNotesMeta(database, chapterID, notes) {
        const sql = 'update master_chapter_mapping set notes_meta = ? where id=?';
        return database.query(sql, [notes, chapterID]);
    }

    static getAllMasterChaptersMapping(database, pageNumber) {
        const pageSize = 50;
        const sql = 'select * from master_chapter_mapping LIMIT ?  OFFSET ?';
        return database.query(sql, [pageSize, pageNumber * pageSize]);
    }

    static getVideoExperimentDetailsdata(database, locale, variantId) {
        const sql = 'select * from premium_video_experiment_config where locale = ? and variant_id=? and is_active=1 limit 1';
        return database.query(sql, [locale, variantId]);
    }

    static getCourseDetailsWithPrice(database, assortmentList) {
        const sql = 'select cd.assortment_id, cd.display_name, cd.parent, v.id, v.display_price, p.duration_in_days, p.batch_id from (select * from course_details where assortment_id in (?) and assortment_type=\'course\') as cd inner join (select assortment_id, id, duration_in_days, batch_id from package where type=\'subscription\' and is_active=1 and reference_type=\'v3\') as p on p.assortment_id=cd.assortment_id inner join (select id, package_id,display_price from variants where is_default=1) as v on v.package_id=p.id order by v.display_price desc limit 1';
        return database.query(sql, [assortmentList]);
    }

    // Course Edit

    static getCourseFilters(db) {
        const sql = 'SELECT distinct class,category_type,year_exam,meta_info,category FROM course_details where category_type is not null and year_exam is not null and meta_info is not null and category is not null';
        return db.query(sql, []);
    }

    static getCourseCategoryTypes(db) {
        const sql = 'SELECT distinct category_type FROM course_details where category_type is NOT NULL';
        return db.query(sql, []);
    }

    static getCourseMetaTypes(db) {
        const sql = 'SELECT distinct meta_info FROM course_details';
        return db.query(sql, []);
    }

    static getCourseYears(db) {
        const sql = 'SELECT distinct year_exam FROM course_details where year_exam is NOT NULL';
        return db.query(sql, []);
    }

    static getCourseCategories(db, categoryType) {
        const sql = 'SELECT distinct category FROM course_details where category_type = ?';
        return db.query(sql, [categoryType]);
    }

    static getCourseBatches(db, assortmentId) {
        const sql = 'SELECT * FROM course_assortment_batch_mapping WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getCoursePackage(db, assortmentId) {
        const sql = 'SELECT * FROM package WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getCourseDetailsThumbnails(db, assortmentId) {
        const sql = 'SELECT * FROM course_details_thumbnails WHERE assortment_id=? and is_active=1';
        return db.query(sql, [assortmentId]);
    }

    static getCourseDetailsBanners(db, assortmentId) {
        const sql = 'SELECT * FROM course_details_banners WHERE assortment_id=? and is_active=1';
        return db.query(sql, [assortmentId]);
    }

    static getCourseStudyGroups(db, assortmentId) {
        const sql = 'SELECT * FROM course_study_groups WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getCourseTimetable(db, assortmentId) {
        const sql = 'SELECT id, is_active, week_of, week_number, topic_covered, subject FROM course_timetable WHERE assortment_id=? and is_active=1';
        return db.query(sql, [assortmentId]);
    }

    static getCourseFaq(db, bucket) {
        const sql = 'SELECT id, locale, question, answer, `type`, priority, is_active, batch_id, offset_time  FROM faq WHERE bucket=? and is_active=1';
        return db.query(sql, [bucket]);
    }

    static getCourseAssortmenPackageMapping(db, assortmentId) {
        const sql = 'SELECT id, student_id, class, subject, thumbnail_url, display_name, book_type, is_active, app_deeplink from assortment_studentid_package_mapping where assortment_id=?  and is_active=1';
        return db.query(sql, [assortmentId]);
    }

    static getCoursePrePurchase(db, assortmentId) {
        const sql = 'SELECT id, priority, locale, title, subtitle, is_active from  course_pre_purchase_highlights where assortment_id=?  and is_active=1';
        return db.query(sql, [assortmentId]);
    }

    static getCourseExperts(db, assortmentId) {
        const sql = 'select distinct expert_name from ( select * from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'resource\' ) as a inner join ( select id as course_resour_id, name as video_name, resource_reference, expert_name, resource_type as video_type,subject from course_resources where (resource_type IN (1,4,8))) as b on b.course_resour_id = a.course_resource_id';
        return db.query(sql, [assortmentId]);
    }

    static getCourseDetails(db, assortmentId) {
        const sql = 'SELECT *, GROUP_CONCAT(class) as classes FROM course_details WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getCourseDetailsByClass(db, assortmentId, classValue) {
        const sql = 'SELECT * FROM course_details WHERE assortment_id=? and class = ?';
        return db.query(sql, [assortmentId, classValue]);
    }

    static getCourseClassesByAssortment(db, assortmentId) {
        const sql = 'SELECT assortment_id, class, is_active FROM course_details WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getCourseChaptersByBatch(db, assortmentId) {
        const sql = 'SELECT name,batch_id FROM course_resource_mapping WHERE assortment_id=?';
        return db.query(sql, [assortmentId]);
    }

    static getVariantsByPackage(db, packageId) {
        const sql = 'SELECT * FROM variants WHERE package_id=?';
        return db.query(sql, [packageId]);
    }

    static insertCourseTimetable(db, timetableArray) {
        const sql = 'insert into course_timetable ( is_active, week_of, week_number, topic_covered, subject, assortment_id ) VALUES ?';
        return db.query(sql, [timetableArray]);
    }

    static updateCourseTimetable(db, timetableObject, timetableId) {
        const sql = 'update course_timetable set ? where id = ?';
        return db.query(sql, [timetableObject, timetableId]);
    }

    static insertCourseFaq(db, faqArray) {
        const sql = 'insert into faq ( locale, question, answer, `type`, priority, is_active, batch_id, offset_time, bucket, bucket_priority, min_version_code, max_version_code) VALUES ?';
        return db.query(sql, [faqArray]);
    }

    static updateCourseFaq(db, faqObject, faqId) {
        const sql = 'update faq set ? where id = ?';
        return db.query(sql, [faqObject, faqId]);
    }

    static insertCoursePrePurchase(db, prePurchaseArray) {
        const sql = 'insert into course_pre_purchase_highlights ( priority, locale, title, subtitle, is_active, assortment_id ) VALUES ?';
        return db.query(sql, [prePurchaseArray]);
    }

    static updateCoursePrePurchase(db, prePurchaseObject, prePurchaseId) {
        const sql = 'update course_pre_purchase_highlights set ? where id = ?';
        return db.query(sql, [prePurchaseObject, prePurchaseId]);
    }

    static insertCourseStudentPackage(db, studentPackageArrray) {
        const sql = 'insert into assortment_studentid_package_mapping ( student_id, class, subject, thumbnail_url, display_name, book_type, is_active, app_deeplink, assortment_id) VALUES ?';
        return db.query(sql, [studentPackageArrray]);
    }

    static updateCourseStudentPackage(db, studentPackageObject, studentPackageId) {
        const sql = 'update assortment_studentid_package_mapping set ? where id = ?';
        return db.query(sql, [studentPackageObject, studentPackageId]);
    }

    static insertCoursePackage(db, assortmentId, batch_id, packageName, description, duration, referenceType) {
        const sql = 'INSERT INTO package (assortment_id, batch_id,name,description, duration_in_days, reference_type,is_default,is_active,type) VALUES (?, ?, ?, ?,?,?,0,0,"subscription")';
        return db.query(sql, [assortmentId, batch_id, packageName, description, duration, referenceType]);
    }

    static updateCoursePackage(db, packageName, description, duration, referenceType, packageId) {
        const sql = 'UPDATE package SET name = ?, description = ?, duration_in_days = ?, reference_type = ? WHERE id=?';
        return db.query(sql, [packageName, description, duration, referenceType, packageId]);
    }

    static insertCourseDetailsBanners(db, assortmentId, batchId, locale, imageUrl, endDate) {
        const sql = 'insert into course_details_banners set assortment_id = ?, batch_id = ?, locale = ?, image_url = ?, banner_order = 1, is_active = 1, start_date = CURRENT_TIMESTAMP, end_date = ?, type = "promo_post"';
        return db.query(sql, [assortmentId, batchId, locale, imageUrl, endDate]);
    }

    static insertCourseStudyGroup(db, assortmentId, batchId, studyGroupName, imageUrl) {
        const sql = 'insert into course_study_groups set  assortment_id = ?, batch_id = ?, study_group_name = ?, img_url = ?, study_group_id = 0';
        return db.query(sql, [assortmentId, batchId, studyGroupName, imageUrl]);
    }

    static updateCourseStudyGroup(db, assortmentId, batchId, name) {
        const sql = 'update course_study_groups set study_group_name = ? where assortment_id = ? and batch_id = ?';
        return db.query(sql, [name, assortmentId, batchId]);
    }

    static disablePreviousBanners(db, bannerIds) {
        const sql = 'update course_details_banners set is_active = 0 where  id in (?)';
        return db.query(sql, [bannerIds]);
    }

    static getAllVideos(db, assortmentId) {
        const sql = 'select cr.*,cd.is_free from (select * from ( select * from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'resource\' ) as a inner join ( select id as course_resour_id, name as video_name, resource_reference, resource_type as video_type,subject from course_resources where (resource_type IN (1,4,8))) as b on b.course_resour_id = a.course_resource_id) as cr inner join course_details as cd on cr.assortment_id = cd.assortment_id group by cd.assortment_id';
        return db.query(sql, [assortmentId]);
    }

    static getAllDemoVideos(db, assortmentId) {
        const sql = 'select cr.*,cd.is_free from (select * from ( select * from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'resource\' ) as a inner join ( select id as course_resour_id, name as video_name, resource_reference, resource_type as video_type,subject from course_resources where (resource_type IN (1,4,8))) as b on b.course_resour_id = a.course_resource_id) as cr inner join course_details as cd on cr.assortment_id = cd.assortment_id where cd.is_free = 1';
        return db.query(sql, [assortmentId]);
    }

    static getCurrentAffairsCarouselData(db) {
        const sql = 'SELECT *,1 as is_free from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id =23 and resource_type ="assortment" ) as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id and b.resource_type = "assortment" left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type="assortment" left join course_resource_mapping as d on c.course_resource_id = d.assortment_id and d.resource_type="resource" and d.batch_id=1 and d.live_at is not null left join course_resources as cr on d.course_resource_id=cr.id where cr.resource_type in (1,8) and cr.subject = "CURRENT AFFAIRS" and d.live_at >= NOW() - INTERVAL 7 DAY ORDER BY d.live_at desc';
        return db.query(sql);
    }

    static getReferralId(db, id) {
        const sql = 'select * from student_referral_disbursement where id=?';
        return db.query(sql, [id]);
    }

    static claimReferralReward(database, data) {
        const sql = 'insert into referral_reward_winners set ?';
        return database.query(sql, [data]);
    }
};
