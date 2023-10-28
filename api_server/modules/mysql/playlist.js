const _ = require('lodash');
const Utility = require('../utility');

module.exports = class Playlist {
    static getByPlaylistId(question_id, database) {

    }

    static getNCERTDataType(gradient, type, description, page, capsule, student_class, limit, language, database) {
        const sql = `select a.chapter as id,? as type,a.chapter_img_url as image_url, case when b.${language} is null then a.chapter else b.${language} end as title,? as class,left(?,40) as description,? as page,? as capsule_bg_color,? as capsule_text_color,? as start_gradient,? as mid_gradient,? as end_gradient, 'NCERT' as capsule_text from (select DISTINCT(chapter),chapter_img_url from ncert_video_meta where class=?) as a left join (select DISTINCT chapter,${language} from localized_ncert_chapter where class=?) as b on a.chapter=b.chapter order by rand() LIMIT ?`;
        // inner join () as z on z.question_id=a.question_id and a.chapter=z.chapter
        // console.log(sql);
        return database.query(sql, [type, student_class, description, page, capsule[2], capsule[1], gradient[0], gradient[1], gradient[2], student_class, student_class, limit]);
    }

    static getNCERTDataNewLibrary(gradient, type, description, page, capsule, student_class, limit, language, parent_id, database) {
        const sql = `select a.id as playlist_id,a.name as id,? as type,a.image_url as image_url, case when b.${language} is null then a.name else b.${language} end as title,? as class,left(?,40) as description,? as page,? as capsule_bg_color,? as capsule_text_color,? as start_gradient,? as mid_gradient,? as end_gradient, 'NCERT' as capsule_text from (select * from new_library where parent=? and is_active=1 and is_delete=0 and subject='MATHS' order by id asc ) as a left join (select DISTINCT chapter,${language} from localized_ncert_chapter where class=?) as b on a.name=b.chapter order by rand() LIMIT ?`;
        return database.query(sql, [type, student_class, description, page, capsule[2], capsule[1], gradient[0], gradient[1], gradient[2], parent_id, student_class, limit]);
    }

    static getNCERTDataNewLibraryWithPCM(gradient, type, description, page, capsule, student_class, limit, language, parent_id, database) {
        const sql = `select a.id as playlist_id,a.name as id,? as type,a.image_url as image_url, case when b.${language} is null then a.name else b.${language} end as title,? as class,left(?,40) as description,? as page,? as capsule_bg_color,? as capsule_text_color,? as start_gradient,? as mid_gradient,? as end_gradient, 'NCERT' as capsule_text from (select * from new_library where parent=? and is_active=1 and is_delete=0 order by id asc ) as a left join (select DISTINCT chapter,${language} from localized_ncert_chapter where class=?) as b on a.name=b.chapter order by rand() LIMIT ?`;
        return database.query(sql, [type, student_class, description, page, capsule[2], capsule[1], gradient[0], gradient[1], gradient[2], parent_id, student_class, limit]);
    }

    static getAllPlaylist(student_id, database) {
        const sql = 'select * from student_playlists where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getQuestionsByPlaylistId(playlist_id, database) {
        const sql = 'select * from playlist_questions_mapping where playlist_id = ?';
        return database.query(sql, [playlist_id]);
    }

    static getAllPlaylistWithQuestions(student_id, database) {
        const sql = `(select * from student_playlists where student_id = '${student_id}') as a left join (select question_id from playlist_questions_mapping where is_active = 1)`;
    }

    static getPlaylistCheck(question_id, student_id, database) {
        const sql = 'select * from playlist_questions_mapping where student_id = ? and question_id = ? and is_active = 1';
        return database.query(sql, [student_id, `${question_id}`]);
    }

    static getAllPlaylistQuestions(student_id, database) {
        const sql = 'select * from playlist_questions_mapping where student_id = ? and is_active = 1';
        return database.query(sql, [student_id]);
    }

    static getAllActivePlaylistQuestionIds(database, student_id) {
        const sql = "select CASE WHEN count(question_id) > 0 THEN GROUP_CONCAT(question_id) ELSE '' END AS question_ids from playlist_questions_mapping where student_id = ? and is_active = 1";
        return database.query(sql, [student_id]);
    }

    static getDpp(student_id, page_no, limit, database) {
        const sql = `select a.*,b.*,c.*,e.packages from ( SELECT question_id,student_id from student_daily_problems_qid where student_id = ? and date(timestamp) = CURDATE() ) as a left join (select ocr_text,question_id,question,matched_question from questions ) as b on a.question_id = b.question_id left join (select * from questions_meta) as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id=e.question_id limit ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(sql, [student_id, limit]);
    }

    static getDppWithLanguage(student_id, language, page_no, limit, database) {
        const sql = `select a.*,b.question_id,b.question,b.matched_question ,case when f.${language} is null then b.ocr_text else f.${language} end as ocr_text,c.*,case when x.${language} is null then c.chapter else x.${language} end as chapter,case when y.${language} is null then c.subtopic else y.${language} end as subtopic,e.packages from ( SELECT question_id,student_id from student_daily_problems_qid where student_id = ? and date(timestamp) = CURDATE() ) as a left join (select ocr_text,question_id,question,matched_question from questions ) as b on a.question_id = b.question_id left join (select * from questions_meta) as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id=e.question_id left join (select question_id,${language} from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on c.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on c.subtopic=y.subtopic limit ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(sql, [student_id, limit]);
    }

    static getCrashCoursePlaylist(student_class, language, page_no, limit, database) {
        const sql = `select * from (select c.question_id,case when e.${language} is null then c.ocr_text else e.${language} end as ocr_text,c.question,c.matched_question,d.packages from ((select id from student_playlists where name like '%CRASH COURSE%' and student_id ='98') as a left join (select question_id,playlist_id from playlist_questions_mapping ) as b on a.id=b.playlist_id left join (select question_id,ocr_text,question,matched_question from questions where is_answered=1) as c on b.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on c.question_id=d.question_id left join (select question_id,${language} from questions_localized ) as e on c.question_id = e.question_id)) as z left join questions_meta on questions_meta.question_id=z.question_id limit ?`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getLatestFromDoubtnutPlaylist(student_class, language, page_no, limit, database) {
        const sql = `select d.*,a.question_id,case when c.english is null then b.ocr_text else c.english end as ocr_text,b.question,b.matched_question,'' as packages from (select question_id,id from engagement where type='viral_videos' and class in (?,'all') and start_date <= CURRENT_TIMESTAMP and end_date >= CURRENT_TIMESTAMP) as a inner join (select question_id,question,matched_question,ocr_text,chapter,student_id from questions where student_id in ('80','82','83','85','86','87','88','89','90','98') and is_answered=1 and is_skipped=0)as b on a.question_id=b.question_id left join (select question_id,english from questions_localized ) as c on a.question_id=c.question_id left join (select * from questions_meta) as d on a.question_id=d.question_id order by a.id desc limit ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static getGeneralKnowledgePlaylist(student_class, language, page_no, limit, database) {
        const sql = `select * from (select b.question_id,case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text,b.question,b.matched_question from ((select question_id,ocr_text,question,matched_question from questions WHERE student_id = 82) as b left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as a on a.question_id=b.question_id left join (select question_id,${language} from questions_localized ) as c on a.question_id = c.question_id)) as z left join questions_meta on questions_meta.question_id=z.question_id limit ?`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getDppSimilar(student_id, limit, database) {
        const sql = 'select b.*,a.*,c.*,e.packages from ( SELECT question_id,student_id from student_daily_problems_qid where student_id = ? ) as a left join (select ocr_text,question_id,question,matched_question from questions where is_answered=1) as b on a.question_id = b.question_id left join (select * from questions_meta) as c on a.question_id=c.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id=e.question_id limit ?';
        return database.query(sql, [student_id, limit]);
    }

    static getCrashCourse(student_id, limit, database) {
        const sql = 'select c.* from (select id from student_playlists where name like \'%CRASH COURSE%\' and student_id =\'98\') as a left join (select question_id,playlist_id from playlist_questions_mapping ) as b on a.id=b.playlist_id inner join (select question_id,ocr_text,question,matched_question from questions where is_answered=1) as c on b.question_id=c.question_id order by b.question_id desc limit ?';
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getPlaylistByPlaylistIdList(student_id, playlist_id, database) {
    // let sql = "Select playlist_questions_mapping.question_id, questions.ocr_text from playlist_questions_mapping,questions, student_playlists where student_playlists.student_id = '" + student_id + "' AND student_playlists.id = '" + playlist_id + "' AND student_playlists.id = playlist_questions_mapping.playlist_id AND playlist_questions_mapping.question_id = questions.question";
    // let sql = "(select * from student_playlists where id = '"+playlist_id+"' AND student_id = '"+student_id+"') as a inner join (select question)"
        const limit = 10;
        const sql = 'select a.question_id,b.ocr_text,b.question from (select question_id from playlist_questions_mapping where playlist_id = ? AND is_active = 1 order by created_at desc limit ?) as a inner join (select question_id,ocr_text,question from questions) as b on a.question_id = b.question_id';
        return database.query(sql, [playlist_id, limit]);
    }

    static getTrendingVideosNew(student_class, limit, language, database) {
        const sql = `select * from (select a.question_id,case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text,b.question,b.matched_question from ((select question_id from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND class = ?) as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id left join (select question_id,${language} from questions_localized ) as c on a.question_id = c.question_id)) as z left join questions_meta on questions_meta.question_id=z.question_id limit ?`;
        // console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static getShowLibraryPlaylist(student_class, limit, language, database) {
        const sql = '';
        // console.log(sql);
        return database.query(sql);
    }
};
