const knex = require('knex')({ client: 'mysql' });
const tables = require('./tables');
const config = require('../../config/config');

module.exports = class Search {
    static getSugg(student_class, limit, language, mysql) {
        if (student_class === 14) {
            student_class = 12;
        }
        const sql = "SELECT distinct f.chapter, f.class,'chapters' as type,'NCERT' as course,g.chapter_display as display from (SELECT c.* from (SELECT b.* from (select question_id from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) AND class =?) as a left join (select question_id,ocr_text,question,matched_question,subject from questions where subject='MATHS' and student_id not in ('80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95','96','97','98')) as b on a.question_id = b.question_id) as c WHERE c.question_id is not null) as d left join questions_meta as f on d.question_id=f.question_id left join (select * from class_chapter_image_mapping where class = ? AND course = 'NCERT') as g on f.chapter=g.chapter and f.class=g.class and g.course='NCERT' order by rand() limit ?";
        return mysql.query(sql, [student_class, student_class, limit]);
    }

    static getTrendingPlaylist(mysql, studentClass, limit, flag) {
        let sql;
        if (flag) {
            sql = 'Select chapter as display, null as hindi_subtopic, date_v, chapter as search_key from content_trend where date_v = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY ) and class=? GROUP by chapter ORDER by count_chapter DESC limit ?'; // takes 0.139 sec approx
        } else {
            sql = 'Select subtopic as display, hindi_subtopic,date_v, concat(chapter, ", ", subtopic) as search_key, hindi_subtopic as hindi_search_key  from content_trend where date_v = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY ) and class=? ORDER by count_subtopic DESC limit ?'; // takes 0.204 sec approx
        }
        return mysql.query(sql, [studentClass, limit]);
    }

    static getSynonyms(database, query) {
        query = query.replace(/'/g, "\\'");
        const sql = knex(tables.inAppSearchFilter).select('find_str', 'replace_word').whereRaw(knex.raw(`MATCH (find_str) AGAINST ('${query}')`)).toQuery();
        return database.query(sql);
    }

    static getRecentWatchedVideo(mysql, sClass, flagVideo, locale) {
        let sql; flagVideo = 0;
        if (flagVideo) {
            sql = `select *,concat("${config.staticCDN}q-thumbnail/",question_id,".png") as image_url from inapp_search_suggestion_video where class=? and locale=? and type='recent_watched_v2' and is_active=1 order by id desc limit 10`;
        } else {
            sql = `select *,concat("${config.staticCDN}q-thumbnail/",question_id,".png") as image_url from inapp_search_suggestion_video where class=? and locale=? and type='recent_watched' and is_active=1 order by id desc limit 10`;
        }
        return mysql.query(sql, [sClass, locale]);
    }

    static getMostWatchedVideo(mysql, sClass) {
        const sql = 'select *, elt(floor(rand() * 6 + 1), \'#DBF2D9\', \'#D9EEF2\', \'#F2DDD9\', \'#F2EED9\', \'#D9DFF2\', \'#EBD9F2\') bg_color from inapp_search_suggestion_video where class=? and type=\'most_watched\' and is_active=1 order by rand() limit 10';
        return mysql.query(sql, [sClass]);
    }

    static getBooksInappPage(mysql, sClass) {
        const sql = 'select * from inapp_search_suggestion_pdf where class=? and type=\'book\' and is_active=1 order by rand() limit 10';
        return mysql.query(sql, [sClass]);
    }

    static getTopicPdf(mysql, sClass) {
        const sql = 'select * from inapp_search_suggestion_pdf where class=? and type=\'topic_pdf\' and is_active=1';
        return mysql.query(sql, [sClass]);
    }

    static getTopicExamPdf(mysql, sClass) {
        const sql = 'select * from inapp_search_suggestion_pdf where class=? and type=\'topic_exam\' and is_active=1';
        return mysql.query(sql, [sClass]);
    }

    static getIasTopTags(mysql, sClass) {
        const sql = 'select data from inapp_search_top_tags where student_class=? and type="subject" and is_active=1 limit 1';
        return mysql.query(sql, [sClass]);
    }

    static getIasPopularOnDoubtnut(mysql, sClass, locale, flag, isFreeApp = false) {
        let sql;
        if (flag) {
            sql = isFreeApp ? `select data from inapp_search_top_tags where student_class=? and type='popular_new_free_app_${locale}' and is_active=1 limit 1` : `select data from inapp_search_top_tags where student_class=? and type='popular_new_${locale}' and is_active=1 limit 1`;
        } else {
            sql = isFreeApp ? 'select data from inapp_search_top_tags where student_class=? and type="popular_free_app" and is_active=1 limit 1' : 'select data from inapp_search_top_tags where student_class=? and type="popular" and is_active=1 limit 1';
        }
        return mysql.query(sql, [sClass]);
    }

    static getIasTopBooks(mysql, sClass) {
        const sql = 'select data from inapp_search_top_tags where student_class=? and type="books" and is_active=1 limit 1';
        return mysql.query(sql, [sClass]);
    }

    static getIasTopExams(mysql, sClass) {
        const sql = 'select data from inapp_search_top_tags where student_class=? and type="exams" and is_active=1 limit 1';
        return mysql.query(sql, [sClass]);
    }

    static getIasTopCourse(mysql, sClass) {
        const sql = 'select data from inapp_search_top_tags where student_class=? and type="course" and is_active=1 limit 1';
        return mysql.query(sql, [sClass]);
    }

    static getIasTopCourseByCCMids(mysql, studentId) {
        const sql = 'select c.category as display, null as image_url from student_course_mapping as a INNER join class_course_mapping as b on a.ccm_id=b.id inner join course_details as c on b.course=c.category and b.class=c.class where a.student_id=? and b.is_active=1 GROUP by c.category';
        return mysql.query(sql, [studentId]);
    }

    static insertPremiumContentBlockViewLogs(mysql, data) {
        const sql = 'insert into premium_content_block_view_log set ?';
        return mysql.query(sql, [data]);
    }

    static getQuestionCreationInfo(mysql, qidArray) {
        const sql = `SELECT class, subject, ocr_text, a.question_id, video_language, target_group, b.answer_video, b.answer_id, b.expert_id from 
        (SELECT question_id, student_id, class, subject, ocr_text from questions where question_id IN (${qidArray})) as a left JOIN 
        (SELECT question_id, answer_id, expert_id, answer_video from answers ) as b ON a.question_id=b.question_id left join 
        (SELECT student_id, video_language, target_group from studentid_package_mapping_new) as c ON a.student_id = c.student_id 
        group by a.question_id`;
        return mysql.query(sql);
    }
};
