module.exports = class Vod {
    static getVodScheduleListByFacultyId(db, facultyId, processed) {
        const sql = 'select a.*, b.faculty_url, b.editor_url, b.edited_by, b.is_qualified from vod_schedule as a left join vod_schedule_video_mapping as b on a.id = b.vod_schedule_id where faculty_id = ? and is_processed = ? and is_deleted = 0';
        return db.query(sql, [facultyId, processed]);
    }

    static getVodScheduleListByFacultyIdAndQuestionId(db, facultyId, processed, questionId) {
        const sql = 'select * from vod_schedule where faculty_id = ? and is_processed = ? and is_deleted = 0 and question_id= ?';
        return db.query(sql, [facultyId, processed, questionId]);
    }

    static getDistinctSubjectFromVodChapterMapping(db) {
        const sql = 'SELECT distinct(subject) as subjects FROM vod_chapter_mapping';
        return db.query(sql);
    }

    static getDistinctClassesBySubjectFromVodChapterMapping(db, subject) {
        const sql = 'SELECT distinct(class) as classes FROM vod_chapter_mapping where subject = ?';
        return db.query(sql, [subject]);
    }

    static getDistinctStateBySubjectClassFromVodChapterMapping(db, subject, class_code) {
        const sql = 'SELECT distinct(state) as states FROM vod_chapter_mapping where subject = ? and class = ?';
        return db.query(sql, [subject, class_code]);
    }

    static getDistinctLanguageBySubjectClassStateFromVodChapterMapping(db, subject, classCode, state) {
        const sql = 'SELECT distinct(language) as languages FROM vod_chapter_mapping where subject = ? and class = ? and state = ?';
        return db.query(sql, [subject, classCode, state]);
    }

    static getDistinctChapterBySubjectClassStateLanguageFromVodChapterMapping(db, subject, classCode, state, language) {
        const sql = 'SELECT distinct(chapter) as chapters FROM vod_chapter_mapping where subject = ? and class = ? and state = ? and language = ?';
        return db.query(sql, [subject, classCode, state, language]);
    }

    static updateMeta(db, scheduleId, updateObject) {
        const sql = 'UPDATE vod_schedule SET ? where id = ?';
        return db.query(sql, [updateObject, scheduleId]);
    }

    static updateMultiMeta(db, updateObject) {
        const sql = 'INSERT INTO vod_schedule_multiple_state_map SET ? ';
        return db.query(sql, [updateObject]);
    }

    static insertTopic(db, insertObject) {
        const sql = 'INSERT into vod_schedule_topic_mapping SET ? ';
        return db.query(sql, [insertObject]);
    }

    static deleteTopicById(db, topicMapId) {
        const sql = 'Update vod_schedule_topic_mapping SET is_deleted = 1 where id = ?';
        return db.query(sql, [topicMapId]);
    }

    static getTopicsByScheduleId(db, scheduleId) {
        const sql = 'select * from vod_schedule_topic_mapping where vod_schedule_id = ?  and is_deleted=0';
        return db.query(sql, [scheduleId]);
    }

    static getWidgetsByScheduleId(db, scheduleId) {
        const sql = 'select * from vod_schedule_widget_mapping where vod_schedule_id = ?  and is_deleted=0';
        return db.query(sql, [scheduleId]);
    }

    static addWidget(db, insertObject) {
        const sql = 'INSERT into vod_schedule_widget_mapping SET ?';
        return db.query(sql, [insertObject]);
    }

    static getAllVods(db) {
        const sql = 'Select * from vod_schedule where is_processed = 5 and is_deleted = 0';
        return db.query(sql);
    }

    static deleteWidget(db, widgetMapId) {
        const sql = 'Update vod_schedule_widget_mapping SET is_deleted = 1 where id = ?';
        return db.query(sql, [widgetMapId]);
    }

    static getVodDataById(db, scheduleId) {
        const sql = 'select * from vod_schedule where id = ? and is_processed = 0 and is_deleted = 0';
        return db.query(sql, [scheduleId]);
    }

    static getClassesByDate(db, facultyId, date, nextdate) {
        const sql = 'select * from vod_schedule where faculty_id = ? and live_at > ? and live_at < ?';
        return db.query(sql, [facultyId, date, nextdate]);
    }

    static getMultipleStateLanguageDataByScheduleId(db, scheduleId) {
        const sql = 'select * from vod_schedule_multiple_state_map where schedule_id = ?  and is_deleted = 0';
        return db.query(sql, [scheduleId]);
    }

    // default year 2023 in vod_class_subject_course_mapping, ask this.
    static getCourseIdsByClassMeta(db, vod_class, subject, stateArray, languageArray, yearExam) {
        const sql = 'SELECT * FROM vod_class_subject_course_mapping where subject = ? and class= ?  and state IN (?) and language IN  (?) and year_exam = ? and is_active=1';
        console.log(subject, vod_class, stateArray, languageArray, yearExam);
        return db.query(sql, [subject, vod_class, stateArray, languageArray, yearExam]);
    }

    static getTopicByScheduleId(db, scheduleId) {
        const sql = 'select * from vod_schedule_topic_mapping where vod_schedule_id = ? and is_deleted = 0 order by visibility_timestamp';
        return db.query(sql, [scheduleId]);
    }

    static getWidgetDataByScheduleId(db, scheduleId) {
        const sql = 'select * from vod_schedule_widget_mapping where  vod_schedule_id = ?';
        return db.query(sql, [scheduleId]);
    }

    static getCourseResourceByOldDetailId(db, scheduleId) {
        const sql = 'select id,resource_type,resource_reference  from course_resources where resource_reference IN  ((select resource_reference  from liveclass_course_resources where liveclass_course_detail_id  IN (?)) )';
        return db.query(sql, scheduleId);
    }

    static updateIsProessedByScheduleId(db, scheduleId, processState) {
        const sql = 'update vod_schedule set is_processed = ? where id = ?';
        return db.query(sql, [processState, scheduleId]);
    }

    static getVodSchedule(db, vodID) {
        const sql = `select * from vod_schedule where id = ${vodID}`;
        return db.query(sql, [vodID]);
    }

    static getFeedback(db, studentLocale, versionCode) {
        const sql = 'select *, concat(et_from, \'-\', et_to) as groupby_key from liveclass_feedback where is_active = 1 and locale = ? and min_version_code <= ? and max_version_code >= ? order by star_rating';
        return db.query(sql, [studentLocale, versionCode, versionCode]);
    }

    static getFromDNProperty(db, bucket, name) {
        const sql = 'select * from dn_property where bucket = ? and name =  ? and is_active = 1 ';
        return db.query(sql, [bucket, name]);
    }

    static getCourseResourceByResourceReference(db, resourceReference) {
        const sql = 'select a.subject,a.topic,a.chapter, a.old_detail_id,a.description,a.faculty_id, a.expert_name as faculty_name, a.name as course_name, a.class, c.category as category, c.meta_info as locale from course_resources as a left join course_resource_mapping as b on a.id = b.course_resource_id and a.old_resource_id = b.old_resource_id left join course_details as c on b.assortment_id = c.assortment_id where a.resource_reference = ? and a.resource_type IN (1,4) limit 1';
        return db.query(sql, [resourceReference]);
    }

    static getChapterIdandOrderByMasterChapter(db, class_id, subject, state, language, chapter) {
        const sql = 'select id,chapter_order from vod_chapter_mapping where class = ? and subject = ? and state = ? and language = ? and chapter = ?';
        return db.query(sql, [class_id, subject, state, language, chapter]);
    }

    static getSubjectIdFromClassAndSubject(db, class_code, subject) {
        const sql = 'select id,subject_order from class_subject_mapping where class = ? and subject = ?';
        return db.query(sql, [class_code, subject]);
    }

    static getChapterDataForSchedleClass(db, liveclass_course_id, subject, chapter) {
        const sql = 'select id,chapter_order from master_chapter_mapping where course_id = ? and subject = ? and chapter = ?';
        return db.query(sql, [liveclass_course_id, subject, chapter]);
    }

    static getVodVideoByScheduleId(db, scheduleId) {
        const sql = 'SELECT * from vod_schedule_video_mapping where vod_schedule_id = ?';
        return db.query(sql, [scheduleId]);
    }

    static insertVodVideo(db, insertObject) {
        const sql = 'INSERT into vod_schedule_video_mapping SET ?';
        return db.query(sql, [insertObject]);
    }

    static updateVodVideo(db, scheduleId, updateObject) {
        const sql = 'UPDATE vod_schedule_video_mapping SET ? where vod_schedule_id = ?';
        return db.query(sql, [updateObject, scheduleId]);
    }

    static getLiveclassInfo(db, reference) {
        const sql = 'select (case when a.resource_type = 4 then 0 else 1 end) as isVod, b.assortment_id as course_resource_id from liveclass_course_resources as a left join (select * from course_details_liveclass_course_mapping) as b on a.liveclass_course_id = b.liveclass_course_id where a.resource_type in (1,4) and a.resource_reference = ? order by isVod limit 1';
        return db.query(sql, [reference]);
    }

    static getVodNotesByScheduleId(db, scheduleId) {
        const sql = 'SELECT * from vod_schedule_notes_mapping where vod_schedule_id = ?';
        return db.query(sql, [scheduleId]);
    }

    static insertVodNotes(db, insertObject) {
        const sql = 'INSERT into vod_schedule_notes_mapping SET ? ';
        return db.query(sql, [insertObject]);
    }

    static getVideoResourcesByAssortmentID(db, assortmentId) {
        const sql = 'select distinct resource_reference from (select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'assortment\') and resource_type = \'resource\' ) as a inner join (select id as course_resour_id, resource_reference from course_resources where (resource_type IN (1,4))) as b on b.course_resour_id = a.course_resource_id';
        return db.query(sql, [assortmentId]);
    }

    // adding (parent_qid,year) to vod_schedule to reuse vods
    static getVodByQid(db, qid) {
        const sql = 'select id from vod_schedule where question_id = ? and is_processed = 1';
        return db.query(sql, [qid]);
    }

    static getLiveclassResRef(db, resourceReference) {
        // lcr - resourceReference
        // const sql = 'select DISTINCT resource_reference, resource_type, meta_info  from liveclass_course_resources lcr  where liveclass_course_detail_id  in (select distinct liveclass_course_detail_id from liveclass_course_resources lcr where resource_reference = ? order by liveclass_course_detail_id desc) and resource_type  = 2 and meta_info not in ("Homework")';
        const sql = `select distinct resource_reference, resource_type, topic, meta_info from liveclass_course_resources 
        where liveclass_course_detail_id in (
        select min(liveclass_course_detail_id) from liveclass_course_resources lcr  where liveclass_course_detail_id  in (
            select distinct liveclass_course_detail_id from liveclass_course_resources lcr where resource_reference = ? order by liveclass_course_detail_id desc
        ) and resource_type  = 2 and meta_info not in ('Homework')
    )  and resource_type  = 2 and meta_info not in ('Homework')`;
        return db.query(sql, [resourceReference.toString()]);
    }

    static getLiveclassResRefHW(db, resourceReference) {
        const sql = 'select distinct resource_reference,liveclass_course_detail_id, resource_type, topic,  meta_info, lh.hw_type,lh.question_list ,lh.location ,lh.new_location, lh.hw_status, lh.question_id ,lh.metainfo as hw_metainfo from liveclass_course_resources lcr left join liveclass_homework lh on lcr.liveclass_course_detail_id = lh.liveclass_detail_id where liveclass_course_detail_id  in (select distinct liveclass_course_detail_id from liveclass_course_resources lcr where resource_reference = ? order by liveclass_course_detail_id desc) and resource_type  = 2 and lh.id is not null and  meta_info in ("Homework") order by liveclass_course_detail_id desc limit 1';
        return db.query(sql, [resourceReference.toString()]);
    }

    static insertLiveclassResRefHW(db, lcdId) {
        const sql = 'insert into liveclass_homework set ?';
        return db.query(sql, [lcdId]);
    }

    // doubt-suggestor - link parent_qid doubts
    static getParentQidByVodQid(db, qid) {
        const sql = 'select parent_qid from vod_schedule where question_id = ?';
        return db.query(sql, [qid]);
    }
};
