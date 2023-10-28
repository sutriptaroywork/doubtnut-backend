const _ = require('lodash');
const UtilityV2 = require('../utilityQuestionV2');

module.exports = class Question {
    static getByQuestionIdWithUrl(questionId, database) {
        const sql = 'SELECT c.*, d.hindi FROM (select a.*,b.url_text from (select * from questions where question_id = ?) as a left join web_question_url as b on a.question_id=b.question_id) AS c LEFT JOIN questions_localized AS d ON c.question_id = d.question_id';
        // console.log(sql);
        return database.query(sql, [questionId]);
    }

    static getDistinctClass(database) {
        const sql = "SELECT DISTINCT class FROM `pdf_download_feature` where class not in (13,14,'all','')";
        return database.query(sql);
    }

    static getDistinctSubject(database, studentClass) {
        // const sql = `select subject from new_library where is_admin_created=1 and resource_type='pdf' and is_delete=0 and student_class= '${studentClass}' and is_active=1 group by subject`;
        const sql = `SELECT DISTINCT subject FROM pdf_download_feature WHERE class= '${studentClass}' and priority_order <> 0 and student_id not in (80,81,82,83,84,85,86,87,93,94,95,96,97,98,99,100)`;
        return database.query(sql);
    }

    static getDistinctChapter(database, studentClass, stuSubject, bookName, limit, page_no) {
        //  const sql = `select distinct chapter from questions where class='${studentClass}' and subject = '${stuSubject}' LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        // const sql = `select chapter_alias from question_chapter_alias where class= '${studentClass}' and subject='${stuSubject}' group by chapter_alias LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        const sql = `SELECT DISTINCT chapter FROM pdf_download_feature WHERE class= '${studentClass}' and student_id not in (80,81,82,83,84,85,86,87,93,94,95,96,97,98,99,100) and subject= '${stuSubject}' and package = '${bookName}' AND priority_order <> 0 order by priority_order asc LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        return database.query(sql);
    }

    static getDistinctBook(database, studentClass, stuSubject, limit, page_no) {
        // const sql = `select distinct book from questions where class='${studentClass}' and subject = '${stuSubject}' and chapter = '${stuChapter}' LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        // const sql = `select book from book_class_mapping where class = '${studentClass}' group by book  LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        const sql = `SELECT DISTINCT package FROM pdf_download_feature WHERE class= '${studentClass}' and student_id not in (80,81,82,83,84,85,86,87,93,94,95,96,97,98,99,100) and subject= '${stuSubject}' AND priority_order <> 0 order by priority_order asc LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        return database.query(sql);
    }

    static getPreviousHistory(student_id, database) {
        const sql = `select question_id,ocr_text from questions where student_id='${student_id}' order by timestamp desc limit 1`;
        // console.log(sql)
        return database.query(sql);
    }

    static getFilteredQuestions(params, database) {
        console.log('112222333queries===');
        const queries = UtilityV2.queryMaker(params);
        // console.log("queries===");console.log(queries.sql)
        return database.query(queries.sql);
    }

    static getQuestionVideoViews(question_id, database) {
        const sql = `SELECT sum(case when is_back=0 then 1 else 0 end) as total_count FROM video_view_stats WHERE question_id ='${question_id}'`;
        return database.query(sql);
    }

    // static getQuestionVideoShareStats(question_id, database){
    //   let sql ="SELECT count(*) as share_count FROM `whatsapp_share_stats` WHERE `entity_id` ='"+question_id+"' and is_active=1 and resource_type='video'"
    //   console.log(sql)
    //   return database.query(sql)
    // }

    static getQuestionVideoViewsWeb(question_id, database) {
        const sql = `select COUNT(*) as total_web_views from web_activity where question_id = '${question_id}' AND type=0`;
        return database.query(sql);
    }

    static getTotalQuestionsCount(params, database) {
        const queries = UtilityV2.queryMaker(params);
        return database.query(queries.countQuery);
    }

    static getMcQuestions(mc_id, database) {
        const queries = `SELECT a.mc_id, b.question_id, b.ocr_text, b.ocr_text_hi, web_question_url.url_text from (SELECT distinct mc_id FROM mc_course_mapping where key_web in (SELECT key_web from mc_course_mapping where mc_id = '${mc_id}')) as a left join (SELECT * from questions_web where student_id = 99 and doubt like 'CV%') as b on a.mc_id = b.doubt LEFT JOIN web_question_url ON b.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL`;
        // let queries = "SELECT a.mc_id, b.question_id, b.ocr_text from (SELECT distinct mc_id FROM `mc_course_mapping` where key_web in (Select key_web from mc_course_mapping where mc_id = '"+mc_id+"')) as a left join (Select * from questions where student_id = 99 and doubt like 'CV%') as b on a.mc_id = b.doubt";
        return database.query(queries);
    }

    static getByQuestionId(question_id, database) {
        // const sql = 'select * from questions where question_id = ?';
        const sql = 'SELECT b.*, a.*, c.id as \'text_solution_id\',c.sub_obj,c.opt_1,c.opt_2,c.opt_3,c.opt_4,c.answer as text_answer,c.solutions as text_solutions FROM (Select * from questions where question_id=?) as a left join answers as b on a.question_id = b.question_id left join text_solutions as c on c.question_id=a.question_id order by b.answer_id desc limit 1';
        return database.query(sql, [question_id]);
    }

    static getPackagesByQid(qid, database) {
        const sql = `select packages from question_package_mapping where question_id='${qid}'`;
        return database.query(sql);
    }

    static getClassandChapterFromMeta(qid, database) {
        const sql = 'Select class,chapter,question_id from questions_meta where question_id= ?';
        return database.query(sql, [qid]);
    }

    static getClassByQid(qid, table, database) {
        const sql = `Select class from ${table} where question_id='${qid}'`;
        console.log(sql); return database.query(sql);
    }

    static getMicroconceptsBySubtopics(sclass, chapter, database) {
        const sql = `Select a.*, b.question_id, b.ocr_text from (Select * from mc_course_mapping where class = '${sclass}' and course = 'NCERT' and chapter = '${chapter}') as a left join (Select * from questions where student_id = 99) as b on a.mc_id=b.doubt`;
        console.log(sql); return database.query(sql);
    }

    static getDistChapters(course, sclass, database) {
        let sql = '';
        if (course == 'IIT') sql = "SELECT distinct(chapter) FROM questions_meta WHERE chapter is not null and class in ('11','12') and target_course <>'BOARDS' and chapter <> 'Skip' and chapter<>''";
        else if (course == 'NCERT') sql = `SELECT distinct(chapter) FROM questions WHERE student_id=1 && class='${sclass}' && is_answered=1`;
        return database.query(sql);
    }

    static getTrendingVideos(student_class, limit, database) {
        const sql = `select a.question_id,b.ocr_text,b.question from ((select question_id from trending_videos where date(created_at) = CURDATE() AND class = '${student_class}') as a left join (select question_id,ocr_text,question from questions) as b on a.question_id = b.question_id) LIMIT ${limit}`;
        return database.query(sql);
    }

    static getTrendingVideoDataType(base_url, gradient, type, description, page, capsule, student_class, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when b.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',b.matched_question,'.png') end as image_url, left(b.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}' as start_gradient, '${gradient[1]}' as mid_gradient, '${gradient[2]}' as end_gradient, e.chapter, e.packages as capsule_text, f.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color FROM (select question_id,created_at from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND class = '${student_class}' LIMIT 5) as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id left join (select c.chapter,d.packages, c.question_id from questions_meta as c left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on c.question_id=d.question_id ) as e on a.question_id=e.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1 ) as f on f.question_id=a.question_id order by a.created_at desc LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getTrendingVideoDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, student_class, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when b.matched_question is null then concat('${base_url}',a.question_id,'.webp') else concat('${base_url}',b.matched_question,'.webp') end as image_url, left(b.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}' as start_gradient, '${gradient[1]}' as mid_gradient, '${gradient[2]}' as end_gradient, e.chapter, e.packages as capsule_text, f.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color,b.resource_type FROM (select question_id,created_at from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND class = '${student_class}' LIMIT 5) as a left join (select question_id,ocr_text,question,matched_question,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions) as b on a.question_id = b.question_id left join (select c.chapter,d.packages, c.question_id from questions_meta as c left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on c.question_id=d.question_id ) as e on a.question_id=e.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1 ) as f on f.question_id=a.question_id order by a.created_at desc LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getTipsAndTricksDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when a.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',a.matched_question,'.png') end as image_url, left(a.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient, '${gradient[1]}' as end_gradient,b.chapter,z.package as capsule_text, d.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color FROM (select matched_question,question_id,student_id,ocr_text from questions WHERE student_id = 81) as a left join (select chapter, question_id from questions_meta) as b on a.question_id=b.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=b.question_id left join (select * from studentid_package_mapping) as z on z.student_id=a.student_id order by rand() LIMIT ${limit}`;
        // console.log(sql);
        return database.query(sql);
    }

    static getTipsAndTricksDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when a.matched_question is null then concat('${base_url}',a.question_id,'.webp') else concat('${base_url}',a.matched_question,'.webp') end as image_url, left(a.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient, '${gradient[1]}' as end_gradient,b.chapter,z.package as capsule_text, d.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color,a.resource_type FROM (select matched_question,question_id,student_id,ocr_text,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions WHERE student_id = 81) as a left join (select chapter, question_id from questions_meta) as b on a.question_id=b.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=b.question_id left join (select * from studentid_package_mapping) as z on z.student_id=a.student_id order by rand() LIMIT ${limit}`;
        // console.log(sql);
        return database.query(sql);
    }

    static getGeneralKnowledgeDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when a.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',a.matched_question,'.png') end as image_url, left(a.ocr_text,50) AS title, left('${description}',40) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, case when a.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[0]}' end as start_gradient, case when a.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[1]}' end as mid_gradient, case when a.student_id not in (80,81,82,83,84,85,86,87,88,89,90,98) then '${gradient[2]}' end as end_gradient,b.chapter,c.packages as capsule_text, d.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color FROM (select question_id,matched_question,ocr_text,student_id from questions WHERE student_id = 82) as a left join (select chapter, question_id from questions_meta) as b on a.question_id=b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as c on a.question_id=c.question_id left join(select duration,question_id from answers order by answer_id DESC ) as d on d.question_id=c.question_id LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getCrashCourseDataType(base_url, gradient, type, description, page, capsule, limit, student_class, duration, database) {
        const sql = `SELECT cast(c.question_id as char(50)) AS id,'${type}' as type,c.subject, case when c.matched_question is null then concat('${base_url}',c.question_id,'.png') else concat('${base_url}',c.matched_question,'.png') end as image_url, left(c.ocr_text,100) AS title, left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color,'${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient,'${gradient[2]}' as end_gradient,d.chapter,'CRASH COURSE' as capsule_text, duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color FROM (select id from student_playlists where name like '%CRASH COURSE%' and student_id ='98') as a inner join (select question_id,playlist_id from playlist_questions_mapping ) as b on a.id=b.playlist_id inner join (select question_id,matched_question,ocr_text,subject from questions WHERE is_answered=1) as c on c.question_id=b.question_id left join (select chapter, question_id from questions_meta) as d on b.question_id=d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id=b.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as f on f.question_id=c.question_id order by rand() limit ${limit}`;
        return database.query(sql);
    }

    static getCrashCourseDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, limit, student_class, duration, database) {
        const sql = `SELECT cast(c.question_id as char(50)) AS id,'${type}' as type,c.subject, case when c.matched_question is null then concat('${base_url}',c.question_id,'.png') else concat('${base_url}',c.matched_question,'.png') end as image_url, left(c.ocr_text,100) AS title, left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color,'${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient,'${gradient[2]}' as end_gradient,d.chapter,'CRASH COURSE' as capsule_text, duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color,c.resource_type FROM (select id from student_playlists where name like '%CRASH COURSE%' and student_id ='98') as a inner join (select question_id,playlist_id from playlist_questions_mapping ) as b on a.id=b.playlist_id inner join (select question_id,matched_question,ocr_text,subject,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions WHERE is_answered=1 or is_text_answered=1) as c on c.question_id=b.question_id left join (select chapter, question_id from questions_meta) as d on b.question_id=d.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on e.question_id=b.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1) as f on f.question_id=c.question_id order by rand() limit ${limit}`;
        return database.query(sql);
    }

    static getLatestFromDoubtnutDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when b.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',b.matched_question,'.png') end as image_url, left(b.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}'as start_gradient, '${gradient[1]}' as mid_gradient, '${gradient[2]}' as end_gradient, b.chapter, z.package as capsule_text,d.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color FROM (select question_id,id from engagement where type='viral_videos' and class in ('${student_class}','all') and start_date <= CURRENT_TIMESTAMP  and end_date >= CURRENT_TIMESTAMP) as a inner join (select question_id,question,matched_question,ocr_text,chapter,student_id from questions where student_id in ('80','82','83','85','86','87','88','89','90','98') and is_answered=1 and is_skipped=0) as b on a.question_id=b.question_id left join (select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=a.question_id left join (select * from studentid_package_mapping) as z on z.student_id=b.student_id order by a.id desc LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getLatestFromDoubtnutDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, database) {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${type}' as type, case when b.matched_question is null then concat('${base_url}',a.question_id,'.webp') else concat('${base_url}',b.matched_question,'.webp') end as image_url, left(b.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}'as start_gradient, '${gradient[1]}' as mid_gradient, '${gradient[2]}' as end_gradient, b.chapter, z.package as capsule_text,d.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color,b.resource_type FROM (select question_id,id from engagement where type='viral_videos' and class in ('${student_class}','all') and start_date <= CURRENT_TIMESTAMP  and end_date >= CURRENT_TIMESTAMP) as a inner join (select question_id,question,matched_question,ocr_text,chapter,student_id,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions where student_id in ('80','82','83','85','86','87','88','89','90','98') and (is_answered=1 or is_text_answered=1) and is_skipped=0) as b on a.question_id=b.question_id left join (select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=a.question_id left join (select * from studentid_package_mapping) as z on z.student_id=b.student_id order by a.id desc LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getTrickyQuestionsSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, weekNo, subjectUrl, database) {
        const sql = `select cast(a.question_id as char(50)) AS id,'${type}' as type,'video_wrapper' as layout_type,case when a.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',a.matched_question,'.png') end as image_url,left(a.ocr_text,100) AS title,left('${description}',100) as description,'${page}' as page,'${capsule[2]}' as capsule_bg_color,'${capsule[1]}' as capsule_text_color, '${gradient[0]}'as start_gradient,'${gradient[1]}' as mid_gradient, '${gradient[2]}' as end_gradient,'' as chapter,'' as capsule_text,e.duration,'${duration[0]}' as duration_text_color,'${duration[1]}' as duration_bg_color,'video' as resource_type,a.subject,case when a.subject='MATHS' then '${subjectUrl[2]}' when a.subject='PHYSICS' then '${subjectUrl[0]}' when a.subject='CHEMISTRY' then '${subjectUrl[1]}' when a.subject='BIOLOGY' then '${subjectUrl[3]}' else '${subjectUrl[4]}' end as subject_image,CASE when SUBSTRING_INDEX(f.book_meta,'||',2)='Physics || Books' then SUBSTR(f.book_meta,21) when SUBSTRING_INDEX(f.book_meta,'||',2)='Chemistry || Books' then SUBSTR(f.book_meta,23) when SUBSTRING_INDEX(f.book_meta,'||',2)='Maths || Books' then SUBSTR(f.book_meta,18) when SUBSTRING_INDEX(f.book_meta,'||',2)='Biology || Books' then SUBSTR(f.book_meta,21) when SUBSTRING_INDEX(f.book_meta,'||',1)='Biology' then SUBSTR(f.book_meta,12) when SUBSTRING_INDEX(f.book_meta,'||',1)='Maths' then SUBSTR(f.book_meta,10) when SUBSTRING_INDEX(f.book_meta,'||',1)='Physics' then SUBSTR(f.book_meta,12) when SUBSTRING_INDEX(f.book_meta,'||',1)='Chemistry' then SUBSTR(f.book_meta,14) else f.book_meta end as book_meta FROM (SELECT question_id,matched_question,ocr_text,subject from questions WHERE student_id= 100 and class='${student_class}' and RIGHT(LEFT(doubt,9),2)='${weekNo}' and is_answered=1) as a left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as d on d.question_id=a.question_id left join answers as e on d.answer_id = e.answer_id inner join book_meta as f on a.matched_question=f.question_id ORDER by rand() LIMIT ${limit}`;
        // console.log(sql)
        return database.query(sql);
    }

    static getVLSVideos(student_class, limit, database) {
        const sql = `Select a.question_id, b.question, b.ocr_text from (Select * from student_playlists where  is_active=1 and student_id='97' and class = '${student_class}' order by id desc limit 1) as d left join (Select * from playlist_questions_mapping where student_id = '97' order by created_at desc) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id limit ${limit}`;
        return database.query(sql);
    }

    static getRecommendedQuestionsList(student_class, limit, database) {
        const sql = `SELECT questions_meta.question_id, questions.ocr_text FROM questions_meta , questions WHERE questions_meta.question_id = questions.question_id AND  questions_meta.doubtnut_recommended = 'Recommended' AND questions_meta.class = '${student_class}' ORDER BY rand() asc LIMIT ${limit}`;
        return database.query(sql);
    }

    static viralVideos(limit, database) {
        const sql = `select  b.* , a.* from (select question_id,ocr_text,question from questions where student_id = '98') as a left join questions_meta as b on a.question_id = b.question_id order by a.question_id desc limit ${limit}`;
        console.log('sql');
        console.log(sql);
        return database.query(sql);
    }

    static getViralVideoByForFeed(limit, page_no, database) {
        const sql = `SELECT question_id, ocr_text,question, 0 as old_views, 0 as new_views, 0 as total_views,matched_question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuestionParentId(question_id, database) {
        const sql = `SELECT parent_id FROM questions_new where question_id=${question_id}`;
        console.log(sql);
        return database.query(sql);
    }

    static updateQuestionParentId(student_id, wha_id, question_id, database) {
        const sql = `update questions_new set student_id = '${student_id}', parent_id='${wha_id}' where question_id = '${question_id}'`;
        console.log(sql);
        return database.query(sql);
    }

    static updateMatched(question_id, database) {
        const sql = `update questions_new set matched_app_questions = 1 where question_id = '${question_id}'`;
        console.log(sql);
        return database.query(sql);
    }

    static updateMatchedAliasTable(question_id, database) {
        const sql = `update questions_new set matched_app_questions = 1 where question_id = '${question_id}'`;
        console.log(sql);
        return database.query(sql);
    }

    static getByQuestionIdFromAliased(database, question_id) {
        const sql = 'select * from questions_new where question_id = ?';
        console.log(sql);
        return database.query(sql, [question_id]);
    }

    static getLastWatchedQuestion(database, studentId) {
        const sql = 'SELECT question_id,question_image,ocr_text,chapter,subject,class FROM `questions_new` WHERE `student_id` = ? AND question NOT IN ("askV10", "askV10_sm") AND doubt NOT IN ("WEB","WHATSAPP","WHATSAPP_NT","DESKTOP_VOICE","MWEB_VOICE","desktop","mweb","desktop-us","mweb-us","APP_US") AND chapter <> "" ORDER BY question_id DESC LIMIT 1';
        return database.query(sql, [studentId]);
    }

    static getDistinctDate(database) {
        const sql = "Select DISTINCT right(left(doubt,17),8) as date_val from questions where doubt like 'JM_19_S%' and student_id = 3";
        return database.query(sql);
    }

    static getDistinctShift(dateVal, database) {
        const sql = `Select distinct right(left(doubt,8),1) as shift_val from questions where doubt like 'JM_19_S%' and student_id = 3 and doubt like '%${dateVal}%'`;
        return database.query(sql);
    }

    static getQuestionsList(dateVal, shiftVal, page, database) {
        let sql = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%' and questions.doubt like '%S${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3";
        }

        sql += ` LIMIT ${(page - 1) * 10}, 10`;
        console.log(sql);

        return database.query(sql);
    }

    static getTotalQuestionsCountSql(dateVal, shiftVal, database) {
        let sql = ''; let countQuery = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%' and questions.doubt like '%S${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3";
        }
        countQuery += `select count(question_id) as total_records FROM (${sql}) as b`;
        console.log(countQuery);
        return database.query(countQuery);
    }

    static getDistinctDateAnswer(database) {
        const sql = "Select DISTINCT right(left(doubt,17),8) as date_val from questions where doubt like 'JM_19_S%' and student_id = 3";
        return database.query(sql);
    }

    static getDistinctShiftAnswer(dateVal, database) {
        const sql = `Select distinct right(left(doubt,8),1) as shift_val from questions where doubt like 'JM_19_S%' and student_id = 3 and doubt like '%${dateVal}%'`;
        return database.query(sql);
    }

    static getQuestionsListAnswer(dateVal, shiftVal, page, database) {
        let sql = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%' and questions.doubt like '%M${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3";
        }

        sql += ` LIMIT ${(page - 1) * 10}, 10`;

        return database.query(sql);
    }

    static getTotalQuestionsCountSqlAnswer(dateVal, shiftVal, database) {
        let sql = ''; let countQuery = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%' and questions.doubt like '%M${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3 and questions.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions.question_id as question_id, questions.question, questions.ocr_text, questions.class, questions.chapter, questions.matched_question, questions_meta.subtopic, questions_meta.target_course, questions_meta.package from questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id where questions.doubt like 'JM_19_S%' and questions.student_id = 3";
        }
        countQuery += `select count(question_id) as total_records FROM (${sql}) as b`;
        return database.query(countQuery);
    }

    static getDistMicroClasses(database) {
        let sql = '';
        sql += 'SELECT DISTINCT class FROM `mc_course_mapping`';
        return database.query(sql);
    }

    static getDistMicroCourses(class_id, database) {
        let sql = '';
        sql += `SELECT DISTINCT course FROM mc_course_mapping WHERE class=${class_id}`;
        return database.query(sql);
    }

    static getDistMicroChapters(class_id, course, database) {
        let sql = '';
        // sql += "SELECT DISTINCT chapter FROM `mc_course_mapping` WHERE class="+class_id+" AND course='"+course+"'";
        sql += `SELECT DISTINCT questions_web.chapter AS chapter FROM mc_course_mapping LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE mc_course_mapping.class=${class_id} AND mc_course_mapping.course='${course}'`;
        return database.query(sql);
    }

    static getDistMicroSubtopics(class_id, course, chapter, database) {
        let sql = '';
        // sql += "SELECT DISTINCT subtopic FROM `mc_course_mapping` WHERE class="+class_id+" AND course='"+course+"' AND chapter='"+chapter+"'";
        sql += `SELECT DISTINCT questions_web.subtopic AS subtopic FROM mc_course_mapping LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE mc_course_mapping.class=${class_id} AND mc_course_mapping.course='${course}' AND mc_course_mapping.chapter='${chapter}'`;
        return database.query(sql);
    }

    static getMicroQuestionsMysql(class_id, course, chapter, subtopic, page, database) {
        let sql = '';
        sql += 'SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, mc_course_mapping.mc_text, questions.question_id FROM `mc_course_mapping` LEFT JOIN questions ON mc_course_mapping.mc_id = questions.doubt WHERE questions.student_id = 99 AND questions.is_answered = 1';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            sql += ` AND mc_course_mapping.class = ${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                sql += ` AND mc_course_mapping.course = '${course}'`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    sql += ` AND mc_course_mapping.chapter = '${chapter}'`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        sql += ` AND mc_course_mapping.subtopic = '${subtopic}'`;
                    }
                }
            }
        }
        sql += ` ORDER BY questions.question_id DESC LIMIT ${(page - 1) * 10}, 10`;
        return database.query(sql);
    }

    static getMicroQuestionsCount(class_id, course, chapter, subtopic, database) {
        let sql = '';
        let countQuery = '';
        sql += 'SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, mc_course_mapping.mc_text, questions.question_id FROM `mc_course_mapping` LEFT JOIN questions ON mc_course_mapping.mc_id = questions.doubt WHERE questions.student_id = 99 AND questions.is_answered = 1';
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            sql += ` AND mc_course_mapping.class = ${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                sql += ` AND mc_course_mapping.course = '${course}'`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    sql += ` AND mc_course_mapping.chapter = '${chapter}'`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        sql += ` AND mc_course_mapping.subtopic = '${subtopic}'`;
                    }
                }
            }
        }
        countQuery += `SELECT count(question_id) as total_records FROM (${sql}) as b`;
        return database.query(countQuery);
    }

    static getQuestionHtmlById(database, questionId) {
        const sql = `SELECT * FROM questions_mathjaxhtml WHERE question_id = ${questionId}`;
        return database.query(sql);
    }

    static getMathJaxHtmlByIds(idsArray, database) {
        const sql = 'SELECT * FROM questions_mathjaxhtml WHERE question_id IN (?)';
        return database.query(sql, [idsArray]);
    }

    static getViralVideoByForFeedLocalisation(limit, page_no, database) {
        const sql = `SELECT questions_web.question_id, questions_web.ocr_text, questions_web.matched_question, web_question_url.url_text FROM questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id='98' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY question_timestamp LIMIT ${limit} OFFSET ${UtilityV2.getOffset(page_no, limit)}`;
        return database.query(sql);
    }

    static getViralVideoWeb(limit, database) {
        const sql = `select a.question_id, a.ocr_text, a.matched_question, b.url_text, c.duration from (select * from questions_web where questions_web.student_id='98') as a left join (select * from web_question_url where url_text IS NOT NULL AND url_text <> '') as b on a.question_id=b.question_id left join (select question_id, duration, max(answer_id) as answer_id from answers group by question_id) as c on a.question_id=c.question_id left join answers as d on c.answer_id=d.answer_id ORDER BY a.question_id DESC LIMIT ${limit}`;
        return database.query(sql);
    }

    static getQuestionByIdLocalised(question_id, database) {
        // let sql = "SELECT * FROM questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.question_id = '" + question_id + "' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        const sql = `SELECT * FROM (select * from questions_web where question_id='${question_id}') as questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''`;
        console.log(sql);
        return database.query(sql);
    }

    static getFilteredQuestionsLocalised(locale_val, params, database) {
        const queries = UtilityV2.queryMakerLocalised(locale_val, params);
        return database.query(queries.sql);
    }

    static getTotalQuestionsCountLocalised(locale_val, params, database) {
        const queries = UtilityV2.queryMakerLocalised(locale_val, params);
        return database.query(queries.countQuery);
    }

    static getByQuestionIdLocalised(locale_val, question_id, database) {
        let sql = 'select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class,';
        if (locale_val == 'hindi') {
            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id where questions_web.question_id = '${question_id}' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT 1`;
        } else {
            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, web_question_url.url_text from questions_web left join web_question_url on questions_web.question_id = web_question_url.question_id where questions_web.question_id = '${question_id}' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' LIMIT 1`;
        }
        return database.query(sql);
    }

    static getMicroconceptsBySubtopicsLocalised(locale_val, sclass, chapter, database) {
        let sql = 'Select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class,';
        if (locale_val == 'hindi') {
            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.class = '${sclass}' AND questions_web.chapter = '${chapter}' AND questions_web.student_id = 99 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''`;
        } else {
            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.mc_id, questions_web.mc_text, questions_web.question_timestamp, questions_web.matched_question, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.class = '${sclass}' AND questions_web.chapter = '${chapter}' AND questions_web.student_id = 99 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''`;
        }
        return database.query(sql);
    }

    static getMicroQuestionsMysqlV3(class_id, course, chapter, subtopic, page, database) {
        let sql = '';
        // sql += "SELECT a.*, web_question_url.url_text FROM(SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, mc_course_mapping.mc_text, questions_web.question_id FROM `mc_course_mapping` LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE questions_web.student_id = 99) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        sql += "SELECT a.*, web_question_url.url_text FROM(SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, questions_web.chapter_clean, questions_web.subtopic_clean, mc_course_mapping.mc_text, questions_web.question_id FROM `mc_course_mapping` LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE questions_web.student_id = 99) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            sql += ` AND a.class = ${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                sql += ` AND a.course = '${course}'`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    sql += ` AND a.chapter_clean = '${chapter}'`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        sql += ` AND a.subtopic_clean = '${subtopic}'`;
                    }
                }
            }
        }
        sql += ` ORDER BY a.question_id DESC LIMIT ${(page - 1) * 5}, 5`;
        return database.query(sql);
    }

    static getMicroQuestionsCountV3(class_id, course, chapter, subtopic, database) {
        let sql = '';
        let countQuery = '';
        // sql += "SELECT a.*, web_question_url.url_text FROM(SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, mc_course_mapping.mc_text, questions_web.question_id FROM `mc_course_mapping` LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE questions_web.student_id = 99) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        sql += "SELECT a.*, web_question_url.url_text FROM(SELECT mc_course_mapping.mc_id, mc_course_mapping.class, mc_course_mapping.course, mc_course_mapping.chapter, mc_course_mapping.subtopic, questions_web.chapter_clean, questions_web.subtopic_clean, mc_course_mapping.mc_text, questions_web.question_id FROM `mc_course_mapping` LEFT JOIN questions_web ON mc_course_mapping.mc_id = questions_web.doubt WHERE questions_web.student_id = 99) AS a LEFT JOIN web_question_url ON a.question_id = web_question_url.question_id WHERE web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            sql += ` AND a.class = ${class_id}`;
            if (course != undefined && !_.isNull(course) && course != '') {
                sql += ` AND a.course = '${course}'`;
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    sql += ` AND a.chapter_clean = '${chapter}'`;
                    if (subtopic != undefined && !_.isNull(subtopic) && subtopic != '') {
                        sql += ` AND a.subtopic_clean = '${subtopic}'`;
                    }
                }
            }
        }
        countQuery += `SELECT count(question_id) as total_records FROM (${sql}) as b`;
        return database.query(countQuery);
    }

    static getDistinctDateNew(database) {
        const sql = "Select DISTINCT right(left(doubt,17),8) as date_val from questions_web where doubt like 'JM_19_S%' and student_id = 3";
        return database.query(sql);
    }

    static getDistinctShiftNew(dateVal, database) {
        const sql = `Select distinct right(left(doubt,8),1) as shift_val from questions_web where doubt like 'JM_19_S%' and student_id = 3 and doubt like '%${dateVal}%'`;
        return database.query(sql);
    }

    static getQuestionsListNew(dateVal, shiftVal, page, database) {
        let sql = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%' and questions_web.doubt like '%S${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }

        sql += ` LIMIT ${(page - 1) * 10}, 10`;
        console.log(sql);

        return database.query(sql);
    }

    static getTotalQuestionsCountSqlNew(dateVal, shiftVal, database) {
        let sql = ''; let countQuery = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%' and questions_web.doubt like '%S${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }
        countQuery += `select count(question_id) as total_records FROM (${sql}) as b`;
        console.log(countQuery);
        return database.query(countQuery);
    }

    static getDistinctDateAnswerNew(database) {
        const sql = "Select DISTINCT right(left(doubt,17),8) as date_val from questions_web where doubt like 'JM_19_S%' and student_id = 3";
        return database.query(sql);
    }

    static getDistinctShiftAnswerNew(dateVal, database) {
        const sql = `Select distinct right(left(doubt,8),1) as shift_val from questions_web where doubt like 'JM_19_S%' and student_id = 3 and doubt like '%${dateVal}%'`;
        return database.query(sql);
    }

    static getQuestionsListAnswerNew(dateVal, shiftVal, page, database) {
        let sql = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%' and questions_web.doubt like '%M${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }

        sql += ` LIMIT ${(page - 1) * 10}, 10`;

        return database.query(sql);
    }

    static getTotalQuestionsCountSqlAnswerNew(dateVal, shiftVal, database) {
        let sql = ''; let countQuery = '';
        if (dateVal != '' && shiftVal != '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%' and questions_web.doubt like '%M${shiftVal}%'`;
        } else if (dateVal != '' && shiftVal == '') {
            sql += `Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' and questions_web.doubt like '%${dateVal}%'`;
        } else {
            sql += "Select questions_web.question_id as question_id, questions_web.ocr_text, questions_web.class, questions_web.chapter, questions_web.matched_question, questions_web.subtopic, questions_web.target_course, questions_web.packages, web_question_url.url_text from questions_web LEFT JOIN web_question_url ON questions_web.question_id = web_question_url.question_id where questions_web.doubt like 'JM_19_S%' and questions_web.student_id = 3 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }
        countQuery += `select count(question_id) as total_records FROM (${sql}) as b`;
        return database.query(countQuery);
    }

    static getQuestionByIdWebLocalised(question_id, database) {
        // let sql = "SELECT * FROM (select * from questions_web where question_id='"+question_id+"') as a LEFT JOIN (select * from web_question_url where url_text IS NOT NULL AND url_text <> '') as b on a.question_id=b.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as c on a.question_id=c.question_id left join answers as d on c.answer_id=d.answer_id ORDER BY a.question_id desc limit 10";
        const sql = `SELECT * FROM (select * from questions_web where question_id='${question_id}') as a LEFT JOIN (select * from web_question_url where url_text IS NOT NULL AND url_text <> '' and question_id='${question_id}') as b on a.question_id=b.question_id left join (select question_id, max(answer_id) as answer_id from answers where question_id='${question_id}' group by question_id) as c on a.question_id=c.question_id left join (Select * from answers where question_id = ${question_id}) as d on c.answer_id=d.answer_id ORDER BY a.question_id desc limit 10`;
        return database.query(sql);
    }

    static getTextSolution(question_id, database) {
        const sql = `SELECT opt_1, opt_2, opt_3, opt_4, answer, solutions FROM text_solutions WHERE question_id = ${question_id} ORDER BY id DESC`;
        return database.query(sql);
    }

    static getLocalisedQuestion(question_id, language, database) {
        const sql = `SELECT ${language} from questions_localized where question_id =${question_id}`;
        return database.query(sql);
    }

    static getEnglishQuestionMeta(question_id, database) {
        const sql = `SELECT case when b.ocr_text is NULL then a.ocr_text else b.ocr_text end as english
        from (select question_id,ocr_text from questions where question_id = ${question_id} AND (is_answered=1 or is_text_answered=1)) as a
        left join (SELECT question_id,ocr_text from ocr_latest where question_id = ${question_id}) as b on a.question_id=b.question_id`;
        return database.query(sql);
    }

    static getPageContent(locale_val, params, database) {
        const queries = UtilityV2.queryMakerLocalised(locale_val, params);
        return database.query(queries.contentSql);
    }

    static getChapterOrder(className, chapter, database) {
        const sql = `SELECT chapter_order FROM ncert_video_meta WHERE class = '${className}' AND chapter = '${chapter}' LIMIT 1`;
        return database.query(sql);
    }

    static getTechnothlonQuestionList(question_id, student_id, identifier, database) {
        const sql = 'SELECT question_id,ocr_text,matched_question,subject FROM questions WHERE student_id = ? AND doubt like ? and is_answered=1';
        // console.log(sql);
        return database.query(sql, [student_id, `%${identifier}%`]);
    }

    static getMatchedQuestionsData(database) {
        const sql = 'Select * from questions where question_credit = 1 AND question_image is not null ORDER BY question_id DESC LIMIT 300';
        return database.query(sql);
    }

    static getSpecialQuestionList(question_id, student_id, student_class, identifier, database) {
        const sql = 'SELECT question_id,ocr_text,matched_question,subject FROM questions WHERE student_id = ? AND class = ? and is_answered=1 and doubt like ?';
        console.log(sql);
        return database.query(sql, [student_id, student_class, `%${identifier}%`]);
    }

    static getSimilarQuestionBelow100(identifier, doubt, student_class, student_id, limit, database) {
        const sql = 'SELECT *  FROM questions USE INDEX(doubt) WHERE doubt LIKE ?  and doubt > ? and is_answered=1  and student_id = ? AND class = ? ORDER by doubt ASC limit ?';
        return database.query(sql, [`${identifier}%`, `${doubt}`, student_id, student_class, limit]);
    }

    static getRelatedConceptVideo(question_id, limit, database) {
        const sql = "Select b.question_id,b.ocr_text,b.question,b.matched_question,b.subject,b.resource_type from (Select * from (Select question_id, microconcept from questions_meta where question_id = ? UNION Select question_id, secondary_microconcept as microconcept from questions_meta where question_id = ?) as c where c.microconcept is not null) as a left join (select question_id,ocr_text,question,matched_question,doubt,subject,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions where student_id = 99 and is_answered =1) as b on a.microconcept = b.doubt where b.question_id <>? limit ?";
        return database.query(sql, [question_id, question_id, question_id, limit]);
        // let sql = "Select b.question_id,b.ocr_text,b.question,b.matched_question,b.subject,b.resource_type from (Select question_id, microconcept from questions_meta where question_id = ?) as a left join (select question_id,ocr_text,question,matched_question,doubt,subject,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions where student_id = 99 and is_answered =1) as b on a.microconcept = b.doubt limit ?";
        // return database.query(sql,[question_id,limit]);
    }

    static getTagList(question_id, database) {
        const sql = `SELECT * FROM structured_course_questions_meta WHERE question_id = ${question_id}`;
        return database.query(sql);
    }

    static getNCERTQuestionData(database, question_id) {
        const sql = 'SELECT * FROM ncert_video_all WHERE question_id = ?';
        return database.query(sql, [question_id]);
    }

    static getNCERTPlaylistData(database, question_id) {
        const sql = `Select d.id, d.name, d.is_last, d.resource_type, d.student_class as class, d.subject, d.main_description, b.description, c.name as chapter, c.id as parent_id from
        (Select * from ncert_video_all where question_id = ?) as a left join new_library as b on a.parent_id = b.id left join new_library as c on b.parent = c.id left join new_library as d on c.id = d.parent where d.playlist_order >= b.playlist_order limit 5`;
        return database.query(sql, [question_id]);
    }

    static getStudentIdFromQuestions(database, questionIdArray) {
        const sql = `select question_id,student_id from questions where question_id in (${questionIdArray})`;
        return database.query(sql);
    }

    static getStudentPackageLang(database, studentIdArray) {
        const sql = `SELECT student_id,package_language FROM studentid_package_mapping_new WHERE student_id in (${studentIdArray})`;
        return database.query(sql);
    }

    static getEtoosQuestionsByMcID(database, mcID) {
        const sql = 'select * from (select * from etoos_mc_course where mc_id = ? limit 1) as a left join (select * from questions where student_id < 100) as b on a.etoos_question_id=b.question_id';
        console.log(sql);
        return database.query(sql, [mcID]);
    }

    static getVideoLangCode(qid, database) {
        const sql = `SELECT b.* FROM questions AS a LEFT JOIN studentid_package_mapping_new AS b ON a.student_id = b.student_id WHERE a.question_id = ${qid}`;
        return database.query(sql);
    }

    static getSidByQid(qid, database) {
        const sql = `SELECT student_id FROM questions WHERE question_id = ${qid}`;
        return database.query(sql);
    }

    static getQdataBySidImg(sid, img, database) {
        const sql = `SELECT * FROM questions_new WHERE student_id = ${sid} AND question_image = '${img}'`;
        return database.query(sql);
    }

    static getMCQuestionId(database, mcList) {
        const sql = `select * from etoos_mc_course emc where mc_id in (${mcList}) ;`;
        console.log(sql);
        return database.query(sql);
    }

    static getClasswiseTopLiveClass(database, studentClass) {
        const sql = `select question_id from ccmid_liveclass where student_class = ${studentClass} ;`;
        console.log(sql);
        return database.query(sql);
    }

    static getQuestionList(database, questionList) {
        const sql = `select * from questions where  question_id in (${questionList}) ;`;
        console.log(sql);
        return database.query(sql);
    }

    static getSameTextQuestions(database, questionIdArray) {
        const sql = `select qid_1, qid_2 from question_mappings_result where qid_1 IN (${questionIdArray}) OR qid_2 IN (${questionIdArray})`;
        return database.query(sql);
    }

    static getLocalisedOcr(database, question_id) {
        const sql = 'SELECT * FROM questions_localized WHERE question_id = ?';
        return database.query(sql, question_id);
    }

    static getUserRecentAskedQuestions(database, student_id, limit) {
        const sql = 'SELECT * FROM questions where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND allocated_to <> 10000 AND LENGTH(ocr_text)> 0 ORDER BY question_id DESC LIMIT ?';
        return database.query(sql, [student_id, limit]);
    }

    static getUserRecentWatchedVideos(database, student_id, limit) {
        const sql = `SELECT
                        a.view_id, a.question_id, a.parent_id, b.subject, b.chapter, b.class,a.video_time, a.engage_time,CASE WHEN c.video_language is not null THEN c.video_language ELSE 'hi-en' END as video_locale
                    FROM
                        (
                            (
                                SELECT
                                *
                                FROM
                                video_view_stats
                                WHERE
                                student_id = ${student_id}
                                AND view_from = 'SRP'
                                ORDER BY
                                created_at DESC
                                LIMIT
                                ${limit}
                            ) AS a
                            LEFT JOIN
                            (
                                SELECT
                                *
                                FROM
                                questions
                            ) AS b on a.question_id = b.question_id
                            LEFT JOIN
                            (
                                SELECT
                                *
                                FROM
                                studentid_package_mapping_new
                            ) AS c on b.student_id = c.student_id
                        )
                    `;
        return database.query(sql);
    }

    static getUserRecentAskedQuestionsForSuggestions(database, student_id, limit) {
        const sql = 'SELECT * FROM questions where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND LENGTH(ocr_text)> 0 ORDER BY question_id DESC LIMIT ?';
        return database.query(sql, [student_id, limit]);
    }

    static getOneMinuteVideo(database, answer_id) {
        const sql = 'SELECT * FROM answer_farm WHERE answer_id = ? AND one_minute = 1';
        return database.query(sql, answer_id);
    }

    static getSimilarData(database, chapter, studentId = '') {
        let sql = 'SELECT a.question_id, MAX(b.answer_id) FROM classzoo1.questions AS a LEFT JOIN classzoo1.answers AS b ON a.question_id = b.question_id WHERE a.chapter = ? AND student_id NOT IN (-55, -53, -194) AND (is_answered  = 1 OR is_text_answered <> 1) AND (b.duration IS NOT NULL OR b.duration <> 0)';
        if (studentId !== '') {
            sql += ` AND a.student_id = ${studentId}`;
        }
        sql += ' GROUP BY a.question_id ORDER BY a.question_id DESC LIMIT 5';
        return database.query(sql, [chapter]);
    }

    static getSimilarDataAfterQid(database, chapter, lastQid, studentId = '') {
        let sql = 'SELECT a.question_id, MAX(b.answer_id) FROM classzoo1.questions AS a LEFT JOIN classzoo1.answers AS b ON a.question_id = b.question_id WHERE a.chapter = ? AND student_id NOT IN (-55, -53, -194) AND (is_answered  = 1 OR is_text_answered <> 1) AND (b.duration IS NOT NULL OR b.duration <> 0) AND a.question_id < ?';
        if (studentId !== '') {
            sql += ` AND a.student_id = ${studentId}`;
        }
        sql += ' GROUP BY a.question_id ORDER BY a.question_id DESC LIMIT 5';
        return database.query(sql, [chapter, lastQid]);
    }

    static getViewDetailsByQuestionId(database, questionId, studentId) {
        const sql = 'SELECT c.*, d.student_id AS main_student_id FROM (SELECT a.*, b.duration FROM (SELECT view_id, question_id, answer_id, answer_video, video_time, engage_time FROM video_view_stats vvs WHERE question_id = ? AND student_id = ? ORDER BY view_id DESC LIMIT 1) AS a LEFT JOIN answers AS b ON a.answer_id = b.answer_id) AS c LEFT JOIN questions AS d ON c.question_id = d.question_id';
        return database.query(sql, [questionId, studentId]);
    }

    static getAllVideoAds(database, sid, locale, versionCode, flagVariants) {
        const sql = 'SELECT * FROM `video_homepage_ad` WHERE language = ? AND page="HOMEPAGE" AND is_active = 1 AND flagr_variant IN (?) AND min_version < ?  AND max_version >= ? AND (ccm_id IN (SELECT ccm_id FROM `student_course_mapping` WHERE `student_id` = ?) OR ccm_id = "all") ORDER BY video_order ASC';
        return database.query(sql, [locale, flagVariants, versionCode, versionCode, sid]);
    }

    static getOcrText(database, qid) {
        const sql = 'SELECT question, ocr_text FROM `questions` WHERE question_id = ?';
        return database.query(sql, qid);
    }

    static getNcertDetails(database, questionId) {
        const sql = 'SELECT * FROM `ncert_questions_details` WHERE question_id = ?';
        return database.query(sql, questionId);
    }

    static getNcertSimilarQuestions(database, masterPlaylistId, rowId) {
        const sql = 'SELECT * FROM `ncert_questions_details` WHERE main_playlist_id = ? AND id > ? LIMIT 9';
        return database.query(sql, [masterPlaylistId, rowId]);
    }

    static getNcertAdditionalQuestions(database, masterPlaylistId, dataLength) {
        const sql = 'SELECT * FROM `ncert_questions_details` WHERE main_playlist_id = ? LIMIT ?';
        return database.query(sql, [masterPlaylistId, dataLength]);
    }

    static getNcertVideosFromChapterName(database, chapterName, studentClass) {
        let sql = '';
        if (studentClass) {
            sql = 'SELECT question_id,main_playlist_id FROM `ncert_questions_details` WHERE chapter_name = ? and student_class= ? limit 1';
            return database.query(sql, [chapterName, studentClass]);
        }
        sql = 'SELECT question_id,main_playlist_id FROM `ncert_questions_details` WHERE chapter_name = ? limit 1';
        return database.query(sql, [chapterName]);
    }

    static getSimilarQuestionsBySid(database, questionId, studentId, qClass) {
        const sql = 'SELECT * FROM `questions` WHERE class = ? AND student_id = ? AND question_id > ? AND is_answered = 1 LIMIT 9';
        return database.query(sql, [qClass, studentId, questionId]);
    }

    static getAdditionalQuestions(database, studentId, qClass, dataLength) {
        const sql = 'SELECT * FROM `questions` WHERE class = ? AND student_id = ? AND is_answered = 1 LIMIT ?';
        return database.query(sql, [qClass, studentId, dataLength]);
    }

    static getSimilarQuestionsByChapter(database, questionId, chapter, qClass, type) {
        let sql = 'SELECT * FROM `questions` WHERE class = ? AND chapter = ? AND is_answered = 1';
        if (type === 'upper') {
            sql += ' AND question_id > ?';
        } else if (type === 'lower') {
            sql += ' AND question_id < ?';
        }
        sql += ' LIMIT 9';
        return database.query(sql, [qClass, chapter, questionId]);
    }

    static getLastVideoAccessId(database, playlistId, questionId) {
        const sql = 'SELECT * FROM ncert_questions_details WHERE main_playlist_id = ? AND question_id = ?';
        return database.query(sql, [playlistId, questionId]);
    }

    static getNcertLastVideoAccessId(database, playlistId, questionId) {
        const sql = 'SELECT * FROM books_details WHERE book_playlist_id = ? AND question_id = ?';
        return database.query(sql, [playlistId, questionId]);
    }

    static getNcertNextVideoDetails(database, id) {
        const sql = 'SELECT * FROM books_details WHERE id = ?';
        return database.query(sql, id);
    }

    static getNcertPlaylistVideoDetails(database, questionId, studentClass) {
        const sql = 'SELECT * FROM books_details WHERE question_id = ? AND student_class = ?';
        return database.query(sql, [questionId, studentClass]);
    }

    static getNextVideoDetails(database, id) {
        const sql = 'SELECT * FROM ncert_questions_details WHERE id = ?';
        return database.query(sql, id);
    }

    static getLastWatchedVideoDetails(database, qid, studentId) {
        const sql = 'SELECT a.*, b.duration FROM video_view_stats As a LEFT JOIN answers AS b ON a.answer_id = b.answer_id WHERE a.question_id = ? AND a.student_id = ? ORDER BY a.view_id DESC LIMIT 1';
        return database.query(sql, [qid, studentId]);
    }

    static getPlaylistVideoDetails(database, questionId, studentClass) {
        const sql = 'SELECT * FROM ncert_questions_details WHERE question_id = ? AND student_class = ?';
        return database.query(sql, [questionId, studentClass]);
    }

    static getNcertNewFlowPlaylistVideoDetails(database, questionId, studentClass) {
        const sql = 'SELECT book_playlist_id,book_name,chapter_name,exercise_name FROM books_details WHERE question_id = ? AND student_class = ?';
        return database.query(sql, [questionId, studentClass]);
    }

    static getFirstVideoOfPlaylist(database, playlistId) {
        const sql = 'SELECT * FROM ncert_questions_details WHERE book_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, playlistId);
    }

    static getFirstVideoOfNcertBook(database, playlistId) {
        const sql = 'SELECT * FROM books_details WHERE book_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, playlistId);
    }

    static getActiveDetails(database, playlist_id, questionId, studentClass, type) {
        let sql;
        if (type === 'main') {
            sql = 'SELECT * FROM ncert_questions_details WHERE main_playlist_id = ? AND question_id = ? AND student_class = ?';
        } else if (type === 'chapter') {
            sql = 'SELECT * FROM ncert_questions_details WHERE chapter_playlist_id = ?';
        } else if (type === 'exercise') {
            sql = 'SELECT * FROM ncert_questions_details WHERE exercise_playlist_id = ?';
        }
        return database.query(sql, [playlist_id, questionId, studentClass]);
    }

    static getNcertNewFlowActiveDetails(database, playlist_id, questionId, studentClass, type) {
        let sql;
        if (type === 'main') {
            sql = 'SELECT * FROM books_details WHERE book_playlist_id = ? AND question_id = ? AND student_class = ?';
        } else if (type === 'chapter') {
            sql = 'SELECT * FROM books_details WHERE chapter_playlist_id = ?';
        } else if (type === 'exercise') {
            sql = 'SELECT * FROM books_details WHERE exercise_playlist_id = ?';
        }
        return database.query(sql, [playlist_id, questionId, studentClass]);
    }

    static getAllNcertDataByPlaylist(database, playlistId, type) {
        let sql;
        if (type === 'chapter') {
            sql = 'SELECT DISTINCT chapter_playlist_id AS id, chapter_name AS title FROM books_details WHERE book_playlist_id = ?';
        } else if (type === 'exercise') {
            sql = 'SELECT DISTINCT exercise_playlist_id AS id, exercise_name AS title FROM books_details WHERE chapter_playlist_id = ?';
        } else if (type === 'questions') {
            sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id FROM (SELECT c.*, d.video_language, d.package_language FROM (SELECT a.id, a.question_id, b.question, b.ocr_text, b.student_id FROM books_details AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.exercise_playlist_id = ? ORDER BY a.id) AS c LEFT JOIN studentid_package_mapping_new AS d ON c.student_id = d.student_id) AS e LEFT JOIN answers AS f ON e.question_id = f.question_id GROUP BY f.question_id';
        }
        return database.query(sql, playlistId);
    }

    static getNcertExercisePlaylistDetails(database, playlistId) {
        const sql = 'SELECT * FROM books_details WHERE exercise_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, playlistId);
    }

    static getAllDataByPlaylist(database, playlistId, type) {
        let sql;
        if (type === 'chapter') {
            sql = 'SELECT DISTINCT chapter_playlist_id AS id, chapter_name AS title, chapter_number FROM ncert_questions_details WHERE book_playlist_id = ? ORDER BY chapter_number';
        } else if (type === 'exercise') {
            sql = 'SELECT DISTINCT exercise_playlist_id AS id, exercise_name AS title FROM ncert_questions_details WHERE chapter_playlist_id = ? ORDER BY exercise_number';
        } else if (type === 'questions') {
            sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id FROM (SELECT c.*, d.video_language, d.package_language FROM (SELECT a.id, a.question_id, b.question, b.ocr_text, b.student_id FROM ncert_questions_details AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.exercise_playlist_id = ? ORDER BY a.id) AS c LEFT JOIN studentid_package_mapping_new AS d ON c.student_id = d.student_id) AS e LEFT JOIN answers AS f ON e.question_id = f.question_id GROUP BY f.question_id';
        }
        return database.query(sql, playlistId);
    }

    static getPlaylistDetails(database, playlistId) {
        const sql = 'SELECT * FROM ncert_questions_details WHERE exercise_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, playlistId);
    }

    static getNcertPlaylistDetails(database, playlistId) {
        const sql = 'SELECT * FROM books_details WHERE exercise_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, playlistId);
    }

    static getBookList(database, playlistId) {
        const sql = 'SELECT * FROM new_library WHERE parent = ? AND is_active = 1 ORDER BY playlist_order';
        return database.query(sql, playlistId);
    }

    static getPlaylistDetailsForParent(database, ncertPlaylistId) {
        const sql = 'SELECT * FROM new_library WHERE id = ? AND is_active = 1 ORDER BY playlist_order';
        return database.query(sql, ncertPlaylistId);
    }

    static getTopQuestionsWeb(database, limit) {
        const sql = 'select b.*, c.canonical_url from top_questions_web a left join questions b on a.question_id = b.question_id left join web_question_url c on a.question_id = c.question_id order by RAND() limit ?';
        return database.query(sql, [limit]);
    }

    static getTopFreeClassQuestions(database, qid, studentClass, locale) {
        const sql = 'select c.* from top_free_classes a join (select master_chapter from top_free_classes where question_id = ?) as b on a.master_chapter = b.master_chapter left join questions c on a.question_id = c.question_id where a.class = ? and a.locale = ? and a.is_active = 1 and a.question_id <> ?';
        return database.query(sql, [qid, studentClass, locale, qid]);
    }

    static getQuestionIDInTopFreeClasses(database, qid) {
        const sql = 'select question_id from top_free_classes where question_id = ?';
        return database.query(sql, [qid]);
    }

    static getPlaylistIdClassWise(database, studentClass) {
        const sql = 'SELECT * FROM `new_library` WHERE `name` = \'NCERT Books Solutions\' AND student_class = ?';
        return database.query(sql, [studentClass]);
    }

    static checkVideoResourceExists(database, questionId) {
        const sql = 'SELECT id FROM course_resources WHERE resource_reference = ? and resource_type in (1,4,8)';
        return database.query(sql, [questionId.toString()]);
    }

    static getLikedVideos(database, student_id) {
        const sql = 'SELECT * FROM `user_answer_feedback` WHERE `student_id` = ? AND `rating` = 5';
        return database.query(sql, [student_id]);
    }

    static getSimilarQuestionsByIds(database, similarQids) {
        const sql = `SELECT * FROM questions WHERE question_id IN (${similarQids})`;
        return database.query(sql);
    }

    static getThumbnailByIds(database, questionId) {
        const sql = 'SELECT EXISTS(SELECT question_id FROM questions WHERE question_id = ? AND is_answered = 1) AS EXIST';
        return database.query(sql, [questionId]);
    }

    static getThumbnailFromQuestionsNew(database, questionId) {
        const sql = 'SELECT EXISTS(SELECT question_id FROM questions WHERE question_id = ? AND is_answered = 1) AS EXIST';
        return database.query(sql, [questionId]);
    }

    static getAskedQuestionsByIds(database, similarQids) {
        const sql = `SELECT question_id, ocr_text, question_image FROM questions_new WHERE question_id IN (${similarQids})`;
        return database.query(sql);
    }

    static getQuestionArrOptions(db, questionIdsArray) {
        const sql = `SELECT question_id, opt_1, opt_2, opt_3, opt_4 FROM text_solutions WHERE question_id IN (${questionIdsArray})`;
        return db.query(sql);
    }

    static getQuestionDetailsForWeb(database, questionIds) {
        const sql = 'SELECT p.package_language as locale,q.class,q.subject,q.chapter,q.question_id,q.ocr_text,a.duration,q.timestamp,w.canonical_url FROM questions q join studentid_package_mapping_new p on q.student_id = p.student_id and q.student_id < 100 and p.to_index = 1 left join answers a on a.question_id = q.question_id left join web_question_url w on q.question_id = w.question_id where q.question_id in (?) group by q.question_id order by q.timestamp desc';
        return database.query(sql, [questionIds]);
    }

    static getChapterNameFromChapterTrans(database, chapterTrans) { // * 40ms
        const sql = 'SELECT chapter from chapter_alias_all_lang where chapter_trans = ?';
        return database.query(sql, [chapterTrans]);
    }

    static getChapterTransNameFromChapterName(database, chapter) { // * 40ms
        const sql = 'SELECT chapter_trans from chapter_alias_all_lang where chapter = ?';
        return database.query(sql, [chapter]);
    }

    static getAllLanguages(database) {
        const sql = 'SELECT lang_code, lang_name FROM language_mapping';
        return database.query(sql);
    }

    static getAnswersByQids(database, qids) {
        const sql = 'SELECT question_id, answer_video FROM answers WHERE question_id IN (?)';
        return database.query(sql, [qids]);
    }

    static getQuestionPackageInfo(database, studentId) {
        const sql = 'select * from studentid_package_mapping_new where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getActiveBookLibraryDetails(database, playlistId, questionId, type) {
        let sql;
        if (type === 'main') {
            sql = 'SELECT * FROM book_questions_details WHERE book_playlist_id = ? AND question_id = ?';
        } else if (type === 'chapter') {
            sql = 'SELECT * FROM book_questions_details WHERE chapter_playlist_id = ?';
        } else if (type === 'exercise') {
            sql = 'SELECT * FROM book_questions_details WHERE exercise_playlist_id = ?';
        }
        return database.query(sql, [playlistId, questionId]);
    }

    static getLatestChapteAlias(database, chapter) {
        const sql = 'SELECT q.question_id, ca.* FROM questions q LEFT JOIN chapter_alias_all_lang ca ON q.chapter = ca.chapter WHERE q.student_id < 100 AND (q.is_answered = 1 OR q.is_text_answered = 1) AND q.chapter = ? ORDER BY ca.id DESC LIMIT 1';
        return database.query(sql, [chapter]);
    }

    static getLast10QuestionsAskedData(database, studentId, exceptSugesstion = false) {
        // 55.7 ms
        let sql = 'SELECT question_id, student_id FROM `questions_new` WHERE `student_id` = ?';
        if (exceptSugesstion) {
            sql += ' AND allocated_to <> 10000';
        }
        sql += ' AND question NOT IN ("askV10", "askV10_sm") AND doubt NOT IN ("WEB","WHATSAPP","WHATSAPP_NT","DESKTOP_VOICE","MWEB_VOICE","desktop","mweb","desktop-us","mweb-us","APP_US") ORDER BY question_id DESC LIMIT 10';
        return database.query(sql, [studentId]);
    }

    static getLast14DaysAskedQuestions(database, studentId) {
        // 12 ms
        const sql = 'SELECT * FROM `questions_new` WHERE student_id = ? AND timestamp >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 14 DAY) LIMIT 1';
        return database.query(sql, [studentId]);
    }

    static getQuestionsWithTextSolutions(database, questionList) {
        const sql = `select a.question_id, a.ocr_text, b.opt_1, b.opt_2, b.opt_3, b.opt_4, b.solutions, b.question_id as text_question_id from ((select * from questions where question_id in (${questionList})) as a left join (select question_id,opt_1, opt_2, opt_3, opt_4, solutions from text_solutions) as b on a.question_id=b.question_id)`;
        return database.query(sql);
    }

    static getQuestionsWithTextSolutionsV2(database, questionList) {
        const sql = `select a.question_id, a.ocr_text, b.opt_1, b.opt_2, b.opt_3, b.opt_4, b.solutions, b.question_id as text_question_id from ((select * from questions where question_id in (${questionList})) as a left join (select question_id,opt_1, opt_2, opt_3, opt_4, solutions from text_solutions) as b on a.question_id=b.question_id) group by question_id`;
        return database.query(sql);
    }

    static getVideoPackageLanguage(database, questionList) {
        const sql = `SELECT a.question_id, b.* FROM questions AS a LEFT JOIN studentid_package_mapping_new AS b ON a.student_id = b.student_id WHERE a.question_id in (${questionList})`;
        return database.query(sql);
    }

    static insertDuplicateQids(database, obj) {
        const sql = 'INSERT INTO qid_package_video_locale_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static insertDuplicateQidsTextSolutions(database, question_id, solutionObj) {
        const obj = {
            question_id,
            ...solutionObj,
        };
        const sql = 'INSERT INTO text_solutions SET ?';
        return database.query(sql, [obj]);
    }

    static updateDuplicateQidsTextSolutions(database, questionId, solutionObj) {
        const sql = `update text_solutions set solutions = '${solutionObj.solutions}' where question_id = ${questionId}`;
        return database.query(sql);
    }

    static getGuidanceVideo(database, limit) {
        const sql = "SELECT DISTINCT a.resource_reference as question_id, a.name as ocr_text, concat('By ',a.expert_name) as question from ( SELECT *  FROM `course_resources` WHERE resource_type in (1,8)) as a inner join (SELECT t1.*, t2.id,lcr.resource_reference from ( SELECT liveclass_course_id,master_chapter,subject,faculty_id,chapter,max(live_at) as live_at FROM liveclass_course_details WHERE liveclass_course_id in (215,1409)  and subject in ('GUIDANCE') and is_replay = 0 and live_at >= '2022-02-01' group by master_chapter,subject,faculty_id,liveclass_course_id) as t1 left join liveclass_course_details as t2 on t1.faculty_id=t2.faculty_id and t1.master_chapter = t2.master_chapter and t1.chapter=t2.chapter and t2.is_replay = 0 and t1.liveclass_course_id=t2.liveclass_course_id and t1.live_at=t2.live_at left join liveclass_course_resources as lcr on t2.id=lcr.liveclass_course_detail_id and lcr.resource_type in (1,8) where t1.live_at <=CURRENT_TIMESTAMP) as b on a.resource_reference=b.resource_reference left join course_details_liveclass_course_mapping as c on b.liveclass_course_id=c.liveclass_course_id left join dashboard_users as d on a.faculty_id=d.id left join course_resource_mapping as e  on a.id=e.course_resource_id and b.id = e.is_trial and e.resource_type='resource' left join course_resource_mapping as f on e.assortment_id=f.course_resource_id and f.resource_type='assortment' left join course_resource_mapping g on f.assortment_id=g.course_resource_id and g.resource_type='assortment' where  d.is_active = 1 and e.is_replay = 0 and a.resource_reference not in (649383815) order by e.live_at desc LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getQidThumbnailExperimentData(db, qid) { // 7ms
        const sql = 'SELECT old_detail_id, class, question_id FROM new_thumbnail_experiment WHERE question_id=? and is_active=1 limit 1';
        return db.query(sql, [qid]);
    }
};
