const Utility = require('./utility');

module.exports = class Question {
    static addQuestion(obj, database) {
        const sql = 'INSERT INTO questions SET ?';
        return database.query(sql, [obj]);
    }

    static addQuestionAliasedTable(obj, database) {
        const sql = 'INSERT INTO questions_new SET ?';
        return database.query(sql, [obj]);
    }

    static updateSubject(subjects, question_id, database) {
        // let sql = "UPDATE questions SET subject='"+subjects+"' where question_id =" + question_id;
        const sql = 'UPDATE questions SET ? where question_id = ?';
        // console.log('sql',sql)
        // console.log('subjects' , subjects)
        return database.query(sql, [subjects, question_id]);
    }

    static addSearchQuestionMeta(obj, database) {
        const sql = 'INSERT INTO questions_meta SET ?';
        return database.query(sql, [obj]);
    }

    static getVideosWatched(question_id, student_id, database) {
        const sql = 'select question_id, video_time, engage_time from video_view_stats where parent_id = ? and student_id = ?';
        return database.query(sql, [question_id, student_id]);
    }

    static getVideosWatchedByParentId(database, question_id) {
        const sql = 'select question_id, video_time, engage_time from video_view_stats where parent_id = ?';
        return database.query(sql, [question_id]);
    }

    static getByQuestionId(question_id, database) {
        const sql = 'select * from questions where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static getByNewQuestionId(question_id, database) {
        const sql = 'select * from questions_new where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static getUserQuestionsOcrDetailsByQid(database, question_id) {
        const sql = 'select ocr_text as ocr from questions_new where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static getQuestionsAskedByStudentId(studentId, database) {
        const sql = 'select * from questions_new where student_id = ? and timestamp<=SUBTIME(CURRENT_TIME,"3000") order by timestamp desc';
        return database.query(sql, [studentId]);
    }

    static getIterationByUserQuestionId(questionId, database) {
        const sql = 'select question from questions_new where question_id = ?';
        return database.query(sql, [questionId]);
    }

    static getFromQuestionsMetaByQuestionId(question_id, database) {
        const sql = 'select * from questions_meta where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static checkQuestionsAskedCountOfaDay(student_id, database) {
        const sql = 'select * from questions_new where student_id = ? and date(timestamp) = CURDATE()';
        return database.query(sql, [student_id]);
    }

    static checkQuestionsAskedCount(studentId, database) {
        const sql = 'select timestamp from questions_new where student_id = ? order by question_id limit 201';
        // let sql = "select count(question_id) as questions_count from questions where student_id ="+student_id+" GROUP BY student_id";
        return database.query(sql, [studentId]);
    }

    static checkQuestionsAskedCountWatchHistoryCompatible(studentId, database) {
        const sql = 'select timestamp from questions_new where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND allocated_to <> 10000 AND LENGTH(ocr_text)>0 order by question_id limit 201';
        return database.query(sql, [studentId]);
    }

    static updateQuestion(obj, question_id, database) {
        const sql = 'UPDATE questions  SET ? where question_id = ?';
        // console.log(sql)
        return database.query(sql, [obj, question_id]);
    }

    static updateQuestionAliasedTable(obj, question_id, database) {
        const sql = 'UPDATE questions_new  SET ? where question_id = ?';
        return database.query(sql, [obj, question_id]);
    }

    static insertExactMatch(database, obj) {
        const sql = 'INSERT INTO questions_exact_match SET ?';
        return database.query(sql, [obj]);
    }

    static getQuestionsOfTheDay(student_class, course, limit, database) {
        const sql = 'SELECT qotd.question_id, questions.ocr_text,questions.question FROM qotd , questions WHERE qotd.question_id = questions.question_id AND  qotd.class = ? AND qotd.course = ? AND DATE(qotd.timestamp) = CURDATE() LIMIT ?';
        return database.query(sql, [student_class, course, limit]);
    }

    static getQuestionsOfTheDayList(student_class, course, database) {
        // let sql = "SELECT qotd.question_id, questions.ocr_text FROM qotd , questions WHERE qotd.question_id = questions.question_id AND  qotd.class = '" + student_class + "' AND qotd.course = '" + course + "' AND DATE(qotd.timestamp) = CURDATE() LIMIT " + limit;
        const sql = 'SELECT qotd.question_id, questions.ocr_text FROM qotd , questions WHERE qotd.question_id = questions.question_id AND  qotd.class = ? AND qotd.course = ?';
        return database.query(sql, [student_class, course]);
    }

    static getRecommendedQuestions(limit, student_class, database) {
        const sql = 'SELECT questions_meta.question_id, questions.ocr_text,questions.question FROM questions_meta , questions WHERE questions_meta.question_id = questions.question_id AND  questions_meta.doubtnut_recommended = \'Recommended\' AND questions_meta.class = ? order by rand() ASC LIMIT ?';
        // let sql = "(select * from questions_meta where doubtnut_recommended = 'Recommended' AND class = '"+student_class+"') as a left join (select question_id,ocr_text,question from questions) as b on a.question_id = b.question_id "
        return database.query(sql, [student_class, limit]);
    }

    static getRecommendedQuestionsList(limit, student_class, database) {
        const sql = 'SELECT questions_meta.question_id, questions.ocr_text FROM questions_meta , questions WHERE questions_meta.question_id = questions.question_id AND  questions_meta.doubtnut_recommended = \'Recommended\' AND questions_meta.class = ? ORDER BY rand() asc LIMIT ?';
        return database.query(sql, [student_class, limit]);
    }

    static getQuestionMeta(question_id, database) {
        const sql = 'SELECT * FROM questions_meta  WHERE question_id =  ?';
        return database.query(sql, [question_id]);
    }

    static getQuestionMetaWithMcText(question_id, database) {
        const sql = 'select y.*, GROUP_CONCAT(y.p) as packages from (select DISTINCT * from (select a.*,b.ocr_text as mc_text,c.ocr_text as secondary_mc_text,d.packages as p from (SELECT * FROM questions_meta  WHERE question_id =  ?) as a left join (select question_id,question,ocr_text,doubt from questions) as b on a.microconcept = b.doubt left join (select question_id,question,ocr_text,doubt from questions) as c on a.secondary_microconcept = c.doubt left join (select packages, question_id from question_package_mapping) as d on d.question_id = a.question_id) x) y';
        return database.query(sql, [question_id]);
    }

    static getQuestionDetails(str, st_class, count, page, database) {
        const sql = `select questions.question_id,questions.ocr_text,questions.question,questions_meta.* FROM questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE ? AND questions.is_skipped = 0 AND questions_meta.class = ? LIMIT ${Utility.getOffset(page, count)},?`;
        return database.query(sql, [str, st_class, count]);
    }

    static getQuestionsByMicroconcepts(microconcept, database) {
        const sql = 'select questions.question_id,questions.ocr_text,questions.question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE microconcept = ? AND is_skipped = 0';
        return database.query(sql, [microconcept]);
    }

    // static getByMcCourseMapping(microconcept_id,student_class,student_course,chapter_order,subtopic_order,microconcept_order, database) {
    static getByMcCourseMappingByClassAndCourse(microconcept_id, student_class, student_course, database) {
        const sql = 'select * from mc_course_mapping where mc_id = ? AND class= ? AND course = ?';

        return database.query(sql, [microconcept_id, student_class, student_course]);
    }

    static getByMcCourseMappingByClassAndCourseANDOrder(student_class, student_course, chapter_order, subtopic_order, microconcept_order, database) {
        const sql = 'select * from mc_course_mapping where class= ? AND course = ? AND chapter_order = ? AND sub_topic_order=? AND micro_concept_order = ?';
        return database.query(sql, [student_class, student_course, chapter_order, subtopic_order, microconcept_order]);
    }

    static getSimilarQuestionsByMcId(mc_id, limit, database) {
        const sql = 'select b.question_id,b.ocr_text,b.question,b.matched_question,b.subject,b.resource_type from (select question_id from questions_meta where microconcept = ? order by rand() ASC LIMIT ?) as a left join (select question_id,ocr_text,question,matched_question,subject,\'video\' as resource_type from questions where is_answered=1) as b on a.question_id = b.question_id';
        return database.query(sql, [mc_id, limit]);
    }

    static getBookMetaData(question_id, database) {
        const sql = 'select doubt from book_meta where question_id=? limit 1';
        return database.query(sql, [question_id]);
    }

    static getSimilarQuestionFromBookMeta(database, doubt) {
        const sql = "select b.doubt,d.question_id,d.ocr_text,d.matched_question,d.subject,'NULL' as target_course,CASE when SUBSTRING_INDEX(b.book_meta,'||',2)='Physics || Books' then SUBSTR(b.book_meta,21) when SUBSTRING_INDEX(b.book_meta,'||',2)='Chemistry || Books' then SUBSTR(b.book_meta,23) when SUBSTRING_INDEX(b.book_meta,'||',2)='Maths || Books' then SUBSTR(b.book_meta,18) when SUBSTRING_INDEX(b.book_meta,'||',2)='Biology || Books' then SUBSTR(b.book_meta,21) when SUBSTRING_INDEX(b.book_meta,'||',1)='Biology' then SUBSTR(b.book_meta,12) when SUBSTRING_INDEX(b.book_meta,'||',1)='Maths' then SUBSTR(b.book_meta,10) when SUBSTRING_INDEX(b.book_meta,'||',1)='Physics' then SUBSTR(b.book_meta,12) when SUBSTRING_INDEX(b.book_meta,'||',1)='Chemistry' then SUBSTR(b.book_meta,14) else b.book_meta end as book_meta from (Select * from book_meta where book_meta in (Select DISTINCT a.book_meta from (SELECT * FROM `book_meta` WHERE doubt>? limit 10) as a)) as b inner join (select * from questions where student_id <100 and is_answered=1 ) as d on b.question_id=d.question_id where b.doubt>? limit 50";
        return database.query(sql, [doubt, doubt]);
    }

    static getSimilarQuestionsByMcIdForSSC(mc_id, limit, database) {
        const sql = 'Select b.question_id,b.ocr_text,b.question,b.matched_question from (Select * from mc_course_mapping where mc_id > ? order by mc_id limit ?) as a left join (Select * from questions where student_id = 99 and class =14 and is_answered=1) as b on a.mc_id=b.doubt where b.question_id is not null order by a.mc_id ASC';
        return database.query(sql, [mc_id, limit]);
    }

    static getQuestionDetailsByDoubt(mc_id, database) {
        const sql = 'select questions.question_id,questions.ocr_text,questions.question,questions.doubt,answers.* FROM questions INNER JOIN answers ON questions.question_id = answers.question_id WHERE  doubt =? AND is_skipped = 0';
        return database.query(sql, [mc_id]);
    }

    static getAllTechnothonQuestions(database) {
        const sql = 'SELECT * FROM questions WHERE student_id=21';
        return database.query(sql);
    }

    static viewAnswerByQid(qid, database) {
        const sql = 'SELECT questions.*, answers.* FROM questions, answers WHERE questions.question_id = answers.question_id AND questions.question_id = ? order by answers.answer_id desc limit 1';
        return database.query(sql, [qid]);
    }

    static getQuestionsByCommunity(class1, limit, database) {
        const sql = 'select questions.*, count(community_questions_upvote.*), questions_meta.* from questions,community_questions,questions_meta_upvote where class = ? AND is_community = 1 AND community_questions_upvote.qid = questions.question_id AND questions.question_id = questions_meta.question_id order by questions.timestamp limit ?';
        return database.query(sql, [class1, limit]);
    }

    static updateFlagCommunity(qid, database) {
        const insert_obj = {};
        insert_obj.is_community = 1;
        const sql = 'UPDATE questions SET ? where question_id = ?';
        return database.query(sql, [insert_obj, qid]);
    }

    /** ****************Filter Functions*************************************************** */

    static getDistinctClasses(database) {
        const sql = 'SELECT distinct(class) FROM mc_course_mapping where active_status=1';
        return database.query(sql);
    }

    static getDistinctChapters(classes, database) {
        let sql = 'SELECT distinct(chapter) FROM mc_course_mapping WHERE ';
        for (let i = 0; i < classes.length; i++) {
            if (i == classes.length - 1) sql += `class='${classes[i]}'`;
            else sql += `class='${classes[i]}' || `;
        }
        return database.query(sql);
    }

    static getDistClasses(course, database) {
        const sql = 'SELECT distinct(class) FROM mc_course_mapping where course= ? and active_status=1';
        return database.query(sql, [course]);
    }

    static getDistClassesForStudyMaterial(study, database) {
        const sql = 'SELECT distinct(class) from questions where student_id=(SELECT student_id from studentid_package_mapping where package=?)';
        return database.query(sql, [study]);
    }

    static getDistChapters(course, sclass, database) {
        let sql = '';
        const params = [];
        if (course == 'IIT') sql = "SELECT distinct(chapter) FROM questions_meta WHERE chapter is not null and class in ('11','12') and target_course <>'BOARDS' and chapter <> 'Skip' and chapter<>''";
        else if (course == 'NCERT') {
            params.push(sclass);
            sql = 'SELECT distinct(chapter) FROM questions WHERE student_id=1 && class=? && is_answered=1';
        }
        return database.query(sql, params);
    }

    static getDistChaptersForStudyMaterial(study, sclass, database) {
        let sql;
        const params = [];
        if (sclass != null) {
            params.push(study, sclass);
            sql = 'SELECT distinct(chapter) from questions where student_id=(SELECT student_id from studentid_package_mapping where package=?) and class=? && is_answered=1';
        } else if (study == 'CENGAGE' && sclass == null) {
            sql = 'SELECT distinct(chapter) FROM (SELECT distinct(chapter),question_id from questions_meta where chapter is not null and chapter<>\'Skip\' and chapter<>\'\') as a left join (SELECT student_id,question_id FROM questions) as b on b.question_id=a.question_id where b.student_id=(SELECT student_id from studentid_package_mapping where package=?)';
            params.push(study);
        } else {
            params.push(study);
            sql = 'SELECT distinct(chapter) from questions where student_id=(SELECT student_id from studentid_package_mapping where package=?) && is_answered=1';
        }
        // console.log(sql);
        return database.query(sql, params);
    }

    static getDistYears(exam, database) {
        let sql = '';
        if (exam == 'Jee Advanced') {
            sql = "SELECT distinct(right(left(doubt,4),2)) as year FROM `questions` where student_id = 8 and doubt like 'JA%' ORDER BY (right(left(doubt,4),2)) ASC";
        } else if (exam == 'Jee Mains') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 3 and doubt like 'JM%' ORDER BY (right(left(doubt,5),2)) ASC";
        } else if (exam == 'X Boards') {
            sql = 'SELECT distinct(right(left(doubt,6),2)) as year FROM `questions` where student_id = 9 ORDER BY (right(left(doubt,6),2)) DESC';
        } else if (exam == 'XII Boards') {
            sql = "SELECT distinct(right(left(doubt,5),2)) as year FROM questions where student_id = 2 and class='12' ORDER BY (right(left(doubt,5),2)) ASC";
        }
        return database.query(sql);
    }

    static getDistSubtopics(chapter, database) {
        const sql = 'SELECT distinct(subtopic) FROM questions_meta WHERE chapter=? and class in (\'11\',\'12\') and target_course <>\'BOARDS\' and subtopic is not null and subtopic <> \'Skip\' and subtopic<> \'\'';
        return database.query(sql, [chapter]);
    }

    static getDistExercises(sclass, chapter, database) {
        const sql = 'Select distinct(b.ncert_exercise_name) as exercise_name, (right(left(doubt,instr(a.doubt,\'_\')+6),3)) as exercise from (Select * from questions where student_id = 1 and class = ? and chapter = ?) as a left join ncert_video_meta as b on a.question_id=b.question_id order by exercise ASC';
        return database.query(sql, [sclass, chapter]);
    }

    static getDistinctSubtopics(classes, chapters, database) {
        let sql = 'SELECT distinct(subtopic) FROM mc_course_mapping WHERE ';

        if (classes.length > 0) {
            for (let i = 0; i < classes.length; i++) {
                if (i == classes.length - 1) sql += `class='${classes[i]}'`;
                else sql += `class='${classes[i]}' || `;
            }
            if (chapters.length > 0) {
                sql += ' && ';
            }
        }

        if (chapters.length > 0) {
            for (let i = 0; i < chapters.length; i++) {
                if (i == chapters.length - 1) sql += `chapter='${chapters[i]}'`;
                else sql += `chapter='${chapters[i]}' || `;
            }
        }

        return database.query(sql);
    }

    static getDistinctCourses() {
        // let sql = "SELECT distinct(course) FROM mc_course_mapping";
        // return database.query(sql);
        const courses = [{ course: 'IIT' }, { course: 'NCERT' }];
        return courses;
    }

    static getDistinctExams() {
        // let sql = "SELECT distinct(course) FROM mc_course_mapping";
        // return database.query(sql);
        const exams = [{ exam: 'Jee Mains' }, { exam: 'Jee Advanced' }, { exam: 'X Boards' }, { exam: 'XII Boards' }];
        return exams;
    }

    static getDistinctLevels() {
        // let sql = "SELECT distinct(level) FROM questions_meta";
        // return database.query(sql);
        const levels = [{ level: 'Basic' }, { level: 'Intermediate' }, { level: 'Advance' }];
        return levels;
    }

    static getDistinctBooks() {
        // let sql = "SELECT distinct(package) FROM questions_meta";
        // return database.query(sql);
        const books = [{ book: 'Cengage' }, { book: 'RD Sharma' }, { book: 'Resonance' }, { book: 'Bansal' }, { book: 'Narayana' }];
        return books;
    }

    /* ---------------get tag data------------------------------*/
    static getTagDataWithoutClass(str, count, page_no, database) {
        const sql = `select a.*,b.question_id,b.ocr_text,b.question,c.packages from((select * from questions_meta where ?) as a left join(select question_id, ocr_text, question from questions) as b on a.question_id = b.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as c on b.question_id = c.question_id) LIMIT ? OFFSET ${Utility.getOffset(page_no, count)}`;
        // console.log(sql);
        return database.query(sql, [str, count]);
    }

    static getTagData(str, count, page_no, database) {
        // let sql = "select a.*,b.question_id,b.ocr_text,b.question,case when a.chapter is null then b.chapter else a.chapter end as chapter, case when a.class is null then b.class else a.class end as class,c.packages from((select * from questions_meta where " + str + " and class IN ("+class1+")) as a left join(select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as b on a.question_id = b.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as c on b.question_id = c.question_id) order by rand() asc  LIMIT " + count + " OFFSET " + Utility.getOffset(page_no, count);
        const sql = `select a.*,b.question_id,b.ocr_text,b.question,case when a.chapter is null then b.chapter else a.chapter end as chapter, case when a.class is null then b.class else a.class end as class,c.packages from (select * from questions_meta where ?) as a left join (select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as b on a.question_id = b.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as c on b.question_id = c.question_id  order by rand() asc  LIMIT ? OFFSET ${Utility.getOffset(page_no, count)}`;
        // console.log(sql);
        return database.query(sql, [str, count]);
    }

    static getTagDataWithLanguage(str, language, count, page_no, database) {
        // let sql = "select a.*,b.question_id,b.ocr_text,b.question,case when a.chapter is null then b.chapter else a.chapter end as chapter, case when a.class is null then b.class else a.class end as class,c.packages from((select * from questions_meta where " + str + " and class IN ("+class1+")) as a left join(select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as b on a.question_id = b.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as c on b.question_id = c.question_id) order by rand() asc  LIMIT " + count + " OFFSET " + Utility.getOffset(page_no, count);
        const sql = `select a.*,b.question_id,case when z.${language} is null then b.ocr_text else z.${language} end as ocr_text,b.question,case when a.chapter is null then b.chapter else a.chapter end as chapter,case when x.${language} is null then a.chapter else x.${language} end as chapter,case when y.${language} is null then a.subtopic else y.${language} end as subtopic, case when a.class is null then b.class else a.class end as class,c.packages from (select * from questions_meta where ?) as a left join (select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as b on a.question_id = b.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as c on b.question_id = c.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on a.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on a.subtopic=y.subtopic left join (select question_id,${language} from questions_localized) as z on b.question_id=z.question_id order by rand() asc  LIMIT ? OFFSET ${Utility.getOffset(page_no, count)}`;
        // console.log(sql);
        return database.query(sql, [str, count]);
    }

    static getTagPackageData(str, count, page_no, database) {
        // let sql = "select b.*,c.question_id,c.ocr_text,c.question,case when b.chapter is null then c.chapter else b.chapter end as chapter, case when b.class is null then c.class else b.class end as class, d.packages from((select * from question_package_mapping where " + str + ") as a left join(select * from questions_meta where class IN ("+class1+")) as b on a.question_id= b.question_id left join(select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as c on a.question_id = c.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as d on a.question_id = d.question_id) order by rand() asc LIMIT " + count + " OFFSET " + Utility.getOffset(page_no, count);
        const sql = `select b.*,c.question_id,c.ocr_text,c.question,case when b.chapter is null then c.chapter else b.chapter end as chapter, case when b.class is null then c.class else b.class end as class, d.packages from (select * from question_package_mapping where ?) as a left join(select * from questions_meta) as b on a.question_id= b.question_id left join(select question_id, ocr_text, question,chapter,class from questions where is_answered = 1) as c on a.question_id = c.question_id left join (select question_id,GROUP_CONCAT(packages) as packages from question_package_mapping group by question_id) as d on a.question_id = d.question_id order by rand() asc LIMIT ? OFFSET ${Utility.getOffset(page_no, count)}`;
        // console.log(sql);
        return database.query(sql, [str, count]);
    }

    /*----------------------------------------------------------------------------------------*/

    static getFilteredQuestions(params, database) {
        const queries = Utility.queryMaker(params);
        return database.query(queries.sql);
    }

    static getTotalQuestionsCount(params, database) {
        const queries = Utility.queryMaker(params);
        return database.query(queries.countQuery);
    }

    static getRecommendedQuestionsForFilters(params, database) {
        let sql = Utility.queryMaker(params);
        if (params.classes.length == 0 && params.chapters.length == 0 && params.subtopics.length == 0 && params.courses.length == 0 && params.books.length == 0 && params.exams.length == 0 && params.levels.length == 0) sql += " WHERE doubtnut_recommended='Recommended'";
        else sql += " && doubtnut_recommended='Recommended'";
        return database.query(sql);
    }

    static getViralVideos(database) {
        const sql = "SELECT * FROM questions WHERE student_id='98' order by question_id desc";
        // console.log(sql);
        return database.query(sql);
    }

    static getViralVideoByLimit(limit, database) {
        const sql = 'SELECT question_id,ocr_text,question FROM questions WHERE student_id=\'98\' order by rand() asc limit ?';
        return database.query(sql, [limit]);
    }

    static getViralVideoByLimitWithLanguage(limit, language, database) {
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (SELECT question_id,ocr_text,question FROM questions WHERE student_id='98' order by rand() asc limit ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        return database.query(sql, [limit]);
    }

    static getVlsByLimit(student_class, limit, language, database) {
        const sql = `Select a.question_id, b.question, case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text from (Select * from student_playlists where  is_active=1 and student_id='97' and class = ? order by id desc limit 1) as d left join (Select * from playlist_questions_mapping where student_id = '97' order by created_at desc) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id left join (select question_id,${language} from questions_localized) as c on a.question_id = c.question_id LIMIT ?`;
        return database.query(sql, [student_class, limit]);
    }

    static getViralVideoByLimitWithViews(limit, page_no, database) {
        const sql = `Select a.*, case when b.new_views is null then 0 else b.new_views end as new_views , case when c.old_views is null then 0 else c.old_views end as old_views, (new_views + old_views) as total_views from ((SELECT question_id,timestamp, ocr_text,question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}) as a left join (select count(view_id) as new_views, question_id from video_view_stats group by question_id) as b on a.question_id = b.question_id left join (select count(view_id) as old_views, question_id from view_download_stats_new group by question_id) as c on a.question_id = c.question_id)`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getViralVideoByLimitWithViewsForForumFeed(student_id, limit, page_no, database) {
        const sql = `Select a.*, case when b.new_views is null then 0 else b.new_views end as new_views , case when c.old_views is null then 0 else c.old_views end as old_views, (new_views + old_views) as total_views,d.is_like from ((SELECT question_id,timestamp, ocr_text,question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}) as a left join (select count(view_id) as new_views, question_id from video_view_stats group by question_id) as b on a.question_id = b.question_id left join (select count(view_id) as old_views, question_id from view_download_stats_new group by question_id) as c on a.question_id = c.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='viral_videos' and student_id = ?) as d on d.resource_id = a.question_id)`;
        // console.log(sql);
        return database.query(sql, [limit, student_id]);
    }

    // static getViralVideoByForFeed(limit,page_no, database) {
    //   let sql = "Select a.*, case when b.new_views is null then 0 else b.new_views end as new_views , case when c.old_views is null then 0 else c.old_views end as old_views, (new_views + old_views) as total_views from ((SELECT question_id, ocr_text,question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit) + ") as a left join (select count(view_id) as new_views, question_id from video_view_stats group by question_id) as b on a.question_id = b.question_id left join (select count(view_id) as old_views, question_id from view_download_stats_new group by question_id) as c on a.question_id = c.question_id)";
    //   console.log(sql)
    //   return database.query(sql);
    // }
    static getViralVideoByForFeed(limit, page_no, database) {
        const sql = `SELECT question_id, ocr_text,question, 0 as old_views, 0 as new_views, 0 as total_views,matched_question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getViralVideoByForFeedWithLanguage(limit, page_no, language, database) {
        const sql = `select a.question_id,a.question,a.old_views,a.new_views,a.total_views,a.matched_question,case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (SELECT question_id, ocr_text,question, 0 as old_views, 0 as new_views, 0 as total_views,matched_question FROM questions WHERE student_id='98' and is_answered=1 and is_skipped=0 order by timestamp desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}) as a left join (select question_id,${language} from questions_localized ) as b on a.question_id=b.question_id`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }

    static getViralVideoFromEngagementPanel(student_class, limit, page_no, language, database) {
        const sql = `select b.*,case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text from (select question_id,id from engagement where type='viral_videos' and class in (?,'all') and start_date <= CURRENT_TIMESTAMP  and end_date >= CURRENT_TIMESTAMP) as a inner join (select question_id,question,matched_question,ocr_text from questions where student_id in ('80','81','82','83','84','85','86','87','88','89','90','98') and is_answered=1 and is_skipped=0) as b on a.question_id=b.question_id left join (select question_id,${language} from questions_localized ) as c on a.question_id=c.question_id order by a.id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static viralVideos(limit, student_class, database) {
        const sql = 'select a.*, b.chapter, b.subtopic, b.microconcept, b.level, b.target_course, b.package, b.type, b.q_options, b.q_answer from (select question_id,ocr_text,question,matched_question from questions where student_id in (\'81\') and is_answered=1 and class=? order by question_id desc limit ?) as a left join questions_meta as b on a.question_id = b.question_id';
        return database.query(sql, [student_class, limit]);
    }

    static latestFromDoubtnutSimilar(limit, student_class, database) {
        const sql = 'select  a.*, b.chapter, b.subtopic, b.microconcept, b.level, b.target_course, b.package, b.type, b.q_options, b.q_answer from (select question_id,ocr_text,question,matched_question from questions where student_id in (\'80\',\'82\',\'83\',\'85\',\'86\',\'87\',\'88\',\'89\',\'90\',\'98\') and is_answered=1 and class=? order by question_id desc limit ?) as a left join questions_meta as b on a.question_id = b.question_id';
        return database.query(sql, [student_class, limit]);
    }

    static getVLSVideos(student_class, limit, database) {
        const sql = 'Select a.question_id, b.question, b.ocr_text,b.matched_question from (Select * from student_playlists where  is_active=1 and student_id=\'97\' and class = ? order by id desc limit 1) as d left join (Select * from playlist_questions_mapping where student_id = \'97\' order by created_at desc) as a on d.id=a.playlist_id left JOIN questions as b on a.question_id=b.question_id limit ?';
        return database.query(sql, [student_class, limit]);
    }

    static getMcIdbyQid(student_class, question_id, database) {
        const sql = 'select * from questions_meta where question_id=? limit 1';
        // console.log(sql)
        return database.query(sql, [question_id]);
    }
    /* ---------------------------------------Community Fuctions-------------------------------------------------*/

    static getCommunityQuestions(student_id, page_no, limit, question_credit, database) {
        let
            sql;
        if (question_credit == '1') {
            sql = `${'Select a.question_id,a.ocr_text,a.question_image,a.student_id,a.question,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted from'

                + ' (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_community=1 and is_answered=0 and is_skipped = 0 ) as a left join'
                + ' (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join'
                + ' (select student_id,student_username from students) as d on a.student_id = d.student_id left join '
                + '(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id '
                + 'left join'
                + " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '"} ?') as e on e.qid = a.question_id order by upvote_count desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '0') {
            sql = `${'Select a.question_id,a.ocr_text,a.question_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted from'
                + ' (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and is_skipped=0) as a left join'
                + ' (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join'
                + ' (select student_id,student_username from students) as d on a.student_id = d.student_id left join '
                + '(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id '
                + 'left join'
                + " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '"} ?') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id order by f.answer_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        }
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getUpvoteCount(question_id, database) {
        const sql = 'select count(*) as vote_count from community_questions_upvote where qid=?';
        return database.query(sql, [question_id]);
    }

    static getLikeCount(type, id, database) {
        const sql = 'select count(*) as like_count from user_engagement_feedback where resource_type=? and resource_id=?';
        return database.query(sql, [type, id]);
    }

    static getCommunityQuestionsForFeedNew(student_id, page_no, limit, question_credit, database) {
        let
            sql;
        if (question_credit == '1') {
            sql = `${'Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at,f.is_like,case when g.like_count is null then 0 else g.like_count end as like_count from'
                + ' (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 7 DAY) ) as a left join'
                + ' (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join '
                + " (select is_like,resource_id from user_engagement_feedback where resource_type='unanswered' and student_id = '"}?') as f on f.resource_id = a.question_id left join (select count(*) as like_count,resource_id,resource_type from user_engagement_feedback where resource_type='unanswered') as g on a.question_id=g.resource_id order by a.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '0') {
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image, 0 as upvote_count, 0 as is_upvoted,  t3.is_like,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id left JOIN (Select * from user_engagement_feedback where resource_type = 'answered' and student_id = ?) as t3 on t1.question_id=t3.resource_id order by t1.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '2') {
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image, 0 as upvote_count, 0 as is_upvoted,  t3.is_like,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and is_text_answered=0 and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id left JOIN (Select * from user_engagement_feedback where resource_type = 'answered' and student_id = ?) as t3 on t1.question_id=t3.resource_id order by t1.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        }
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getCommunityQuestionsForFeed(student_id, page_no, limit, question_credit, database) {
        let sql;
        const params = [];
        if (question_credit == '1') {
            params.push(student_id, student_id, limit);
            sql = `${'Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.matched_question,a.timestamp as created_at, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,f.is_like from'
                + ' (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where questions.is_community=1 and questions.is_answered=0 and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 7 DAY) ) as a left join'
                + ' (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join'
                + " (select student_id,case when student_fname = '' then student_username else student_fname end as student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join "
                + '(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id '
                + 'left join'
                + " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '"}?') as e on e.qid = a.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='unanswered' and student_id = ?) as f on f.resource_id = a.question_id order by a.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '0') {
            params.push(student_id, limit);
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image, 0 as upvote_count, 0 as is_upvoted,  t3.is_like,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id left JOIN (Select * from user_engagement_feedback where resource_type = 'answered' and student_id = ?) as t3 on t1.question_id=t3.resource_id order by t1.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        } else if (question_credit == '2') {
            params.push(student_id, limit);
            // sql = "Select a.question_id,a.ocr_text,a.question_image,d.profile_image,a.student_id,a.question,a.timestamp as created_at,a.matched_question, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted,g.is_like from" +
            //   " (SELECT question_id,ocr_text,question_image,student_id,question,timestamp,matched_question FROM questions where is_answered=1 and matched_question is null and is_skipped = 0 and date(timestamp) > date_sub(CURRENT_DATE, INTERVAL 10 DAY)) as a left join" +
            //   " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
            //   " (select student_id,student_username,img_url as profile_image from students) as d on a.student_id = d.student_id left join " +
            //   "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
            //   "left join" +
            //   " (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as f on a.question_id = f.question_id left join (select is_like,resource_id from user_engagement_feedback where resource_type='answered' and student_id = '"+student_id+"') as g on g.resource_id = a.question_id order by f.answer_id desc LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
            sql = `Select t1.*, NULL as chapter, NULL as subtopic, t2.student_username, t2.img_url as profile_image, 0 as upvote_count, 0 as is_upvoted,  t3.is_like,t1.timestamp as created_at FROM (SELECT question_id,ocr_text,question_image,student_id,question,timestamp ,matched_question FROM questions where is_answered=1 and is_text_answered=0 and is_skipped = 0) as t1 left JOIN (Select * from students where is_web=0) as t2 on t1.student_id=t2.student_id left JOIN (Select * from user_engagement_feedback where resource_type = 'answered' and student_id = ?) as t3 on t1.question_id=t3.resource_id order by t1.question_id desc LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        }
        // console.log(sql);
        return database.query(sql, params);
    }

    // static getAnsweredQuestion(student_id, class1, page_no, limit, database) {
    //   let sql = "Select a.*, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then FALSE else TRUE end as is_upvoted from" +
    //     " (SELECT question_id,ocr_text,question_image,student_id FROM questions where questions.is_community=1 and questions.question_credit=0  and questions.is_answered=1 and questions.class= ?) as a left join" +
    //     " (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join" +
    //     " (select student_id,student_username from students) as d on a.student_id = d.student_id left join " +
    //     "(select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id " +
    //     "left join" +
    //     " (select COUNT(*) as is_upvote,qid from community_questions_upvote where voter_id = '" + student_id + "') as e on e.qid = a.question_id LIMIT " + limit + " OFFSET " + Utility.getOffset(page_no, limit);
    //   return database.query(sql, class1);
    // }
    //
    static getUnansweredQuestion(student_id, class1, page_no, limit, database) {
        const sql = `${'Select a.*, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted from (SELECT question_id,ocr_text,question_image,student_id FROM questions where questions.is_community=1 and questions.question_credit=1 and questions.class= ?) as a left join (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join (select student_id,student_username from students) as d on a.student_id = d.student_id left join (select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id '
            + 'left join'
            + " (select COUNT(*) as is_upvote,qid from community_questions_upvote where voter_id = '"} ?') as e on e.qid = a.question_id LIMIT ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [class1, student_id, limit]);
    }

    static getStatsQuestions(student_id, page_no, limit, database) {
        const sql = `${'Select a.question_id,a.student_id,a.ocr_text,a.question_credit,a.is_answered,a.question,a.question_image,  case when d.chapter is null then b.chapter else d.chapter end as chapter , case when d.chapter is null then b.subtopic else d.subtopic end as subtopic  , case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count from(SELECT question_id , student_id, ocr_text,question_credit,is_answered,question,question_image,timestamp FROM questions where questions.is_community = 1  and questions.student_id = ? order by timestamp desc) as a left join'
            + '(SELECT qid, chapter , subtopic from community_questions_meta) as b on a.question_id = b.qid left join'
            + '(SELECT * from questions_meta) as d on d.question_id = a.question_id left join'
            + ' (select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id  order by upvote_count desc LIMIT '}? OFFSET ${Utility.getOffset(page_no, limit)}`;
        return database.query(sql, [student_id, limit]);
    }

    static getCommunityQuestionByQid(question_id, student_id, database) {
        const sql = 'Select a.*, b.*, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted from (SELECT question_id,ocr_text,question_image,student_id,is_answered,question,matched_question FROM questions where questions.is_community=1 and questions.question_id= ?) as a left join (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join (select student_id,student_username from students) as d on a.student_id = d.student_id left join (select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id '
            + 'left join'
            + ' (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id';
        // console.log(sql);
        return database.query(sql, [question_id, student_id]);
    }

    static getCommunityQuestionByQidWithLanguage(question_id, student_id, language, database) {
        const sql = `Select a.*, b.qid,case when x.${language} is null then b.chapter else x.${language} end as chapter, case when y.${language} is null then b.subtopic else y.${language} end as subtopic, case when c.upvote_count is null then 0 else c.upvote_count end as upvote_count, d.*,case when e.is_upvote is NULL then 0 else 1 end as is_upvoted from (SELECT question_id,ocr_text,question_image,student_id,is_answered,question,matched_question FROM questions where questions.is_community=1 and questions.question_id= ?) as a left join (SELECT qid,chapter,subtopic from community_questions_meta) as b on a.question_id = b.qid left join (select student_id,student_username from students) as d on a.student_id = d.student_id left join (select qid, count(id) as upvote_count from community_questions_upvote group by community_questions_upvote.qid) as c on c.qid = a.question_id `
            + 'left join'
            + ` (select voter_id as is_upvote,qid from community_questions_upvote where voter_id = ?) as e on e.qid = a.question_id left join (select chapter,min(${language}) as ${language} from localized_chapter group by chapter) as x on b.chapter=x.chapter left join (select subtopic,min(${language}) as ${language} from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic`;
        console.log(sql);
        return database.query(sql, [question_id, student_id]);
    }

    static getTrendingVideos(student_class, limit, language, database) {
        const sql = `select b.question_id,case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text,b.question,b.matched_question from ((select question_id from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND class = ?) as a left join (select question_id,ocr_text,question,matched_question from questions where is_answered=1) as b on a.question_id = b.question_id left join (select question_id,${language} from questions_localized ) as c on a.question_id = c.question_id) LIMIT ?`;
        return database.query(sql, [student_class, limit]);
    }

    static getTrendingVideos1(student_class, limit, database) {
        const sql = 'select a.question_id,b.ocr_text,b.matched_question from ((select question_id from trending_videos where date(created_at) = CURDATE() AND class = ?) as a left join (select question_id,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id ) LIMIT ?';
        return database.query(sql, [student_class, limit]);
    }

    static updateQuestionCredit(question_id, database) {
        const sql = 'UPDATE questions set question_credit=0 where question_id=?';
        return database.query(sql, [question_id]);
    }

    static firstQuestionAsk(student_id, question_id, database) {
        const sql = 'Select case when f.first_question+f.view_parent=2 then 1 else 0 end as show_rating from (Select case when a.count_q=1 then 1 else 0 end as first_question, case when b.view_id is null then 0 else 1 end as view_parent from ( SELECT student_id, count(question_id) as count_q FROM questions_new where student_id = ?) as a left JOIN (Select student_id, max(view_id) as view_id from video_view_stats where student_id = ? and parent_id = ? and video_time>=40) as b on a.student_id=b.student_id) as f';
        return database.query(sql, [student_id, student_id, question_id]);
    }

    static getPackagesByQid(qid, database) {
        const sql = 'select packages from question_package_mapping where question_id=?';
        return database.query(sql, [qid]);
    }

    static getClassByQid(qid, table, database) {
        const sql = 'Select class from ? where question_id=?';
        // console.log(sql);
        return database.query(sql, [table, qid]);
    }

    static getMostWatchedVideoCountBySid(student_id, database) {
        const sql = 'SELECT student_id, count(view_id) as video_count,sum(engage_time) as total_engagement_time FROM video_view_stats where student_id = ? and created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static getTodayMostWatchedStudents(database) {
        const sql = 'Select a.*, b.student_username, b.student_fname, b.img_url as profile_image from (SELECT student_id, count(view_id) as video_count, sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id order by count(view_id) desc, sum(engage_time) desc limit 5) as a left join students as b on a.student_id=b.student_id';
        return database.query(sql);
    }

    static getLastdayWinners(database) {
        const sql = 'Select a.*, b.student_username, b.student_fname, b.img_url as profile_image from (SELECT student_id, count(view_id) as video_count, sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=date_sub(CURRENT_DATE,INTERVAl 1 DAY) and created_at<CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id order by count(view_id) desc, sum(engage_time) desc limit 5) as a left join students as b on a.student_id=b.student_id';
        return database.query(sql);
    }

    static getContestDetails(database) {
        const sql = "select * from daily_contest_design where contest_type='daily_watch'";
        return database.query(sql);
    }

    static getMicroconceptsBySubtopics(sclass, chapter, database) {
        const sql = 'Select a.*, b.question_id, b.ocr_text from (Select * from mc_course_mapping where class = ? and course = \'NCERT\' and chapter = ?) as a left join (Select * from questions where student_id = 99) as b on a.mc_id=b.doubt';
        // console.log(sql);
        return database.query(sql, [sclass, chapter]);
    }

    static getClassandChapterFromMeta(qid, database) {
        const sql = 'Select class,chapter from questions_meta where question_id=?';
        return database.query(sql, [qid]);
    }

    static checkTrendingVideos(student_class, database) {
        const sql = 'select question_id from trending_videos where date(created_at) = CURDATE() AND class = ?';
        // console.log(sql);
        return database.query(sql, [student_class]);
    }

    static checkDPP(student_id, database) {
        const sql = 'SELECT question_id,student_id from student_daily_problems_qid where student_id = ? and date(timestamp) = CURDATE()';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static checkVLS(student_class, database) {
        const sql = 'Select * from student_playlists where  is_active=1 and student_id=\'97\' and class = ? order by id desc limit 1';
        // console.log(sql);
        return database.query(sql, [student_class]);
    }

    static getByQuestionIdNew(question_id, database) {
        const sql = 'select * from questions_web where question_id = ?';
        return database.query(sql, [question_id]);
    }

    static addQuestionNew(obj, database) {
        const sql = 'INSERT INTO questions_web SET ?';
        return database.query(sql, [obj]);
    }

    static updateQuestionNew(obj, question_id, database) {
        const sql = 'UPDATE questions_web SET ? where question_id = ?';
        // console.log(sql);
        return database.query(sql, [obj, question_id]);
    }

    static setLike(qid, db) {
        const sql = 'INSERT INTO `web_activity` (`id`, `question_id`, `type`) VALUES (\'\', ?, \'1\')';
        return db.query(sql, [qid]);
    }

    static setView(qid, db) {
        const sql = 'INSERT INTO `web_activity` (`id`, `question_id`, `type`) VALUES (\'\', ?, \'0\')';
        return db.query(sql, [qid]);
    }

    static insertRating(obj, database) {
        // let sql = "INSERT INTO `whatsapp_rating` (`question_id`, `student_id`, `rating1`, `rating2`, `feedback`, `report`) VALUES ('"+qid+"', '"+sid+"', '"+rating1+"', '"+rating2+"', '"+feedback+"', '"+report+"')";
        const sql = 'INSERT INTO whatsapp_rating SET ?';
        return database.query(sql, [obj]);
    }

    static insertRatingNew(obj, database) {
        // let sql = "INSERT INTO `whatsapp_rating` (`question_id`, `student_id`, `rating1`, `rating2`, `feedback`, `report`) VALUES ('"+qid+"', '"+sid+"', '"+rating1+"', '"+rating2+"', '"+feedback+"', '"+report+"')";
        const sql = 'INSERT INTO whatsapp_rating SET ?';
        return database.query(sql, [obj]);
    }

    static getRating(question_id, student_id, database) {
        const sql = 'SELECT * FROM whatsapp_rating WHERE question_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1';
        // console.log(sql);
        return database.query(sql, [question_id, student_id]);
    }

    static getTechnothonQuestions(year, page, limit, database) {
        const sql = `select a.question_id, a.ocr_text, b.url_text, a.chapter, a.question_no from (SELECT question_id,ocr_text, chapter, SUBSTRING(doubt, LENGTH(SUBSTRING_INDEX(doubt, '_', 4))+2, 3)*1 as question_no FROM questions_web WHERE student_id=21 and doubt like '%?%' and is_answered=1 limit ? OFFSET ${Utility.getOffset(page, limit)}) as a left join web_question_url as b on a.question_id = b.question_id`;
        // console.log(sql);
        return database.query(sql, [year, limit]);
    }

    static getTechnothonQuestionsCount(year, database) {
        const sql = 'SELECT count(question_id) as count FROM questions_web WHERE student_id=21 and doubt like ?';
        return database.query(sql, [`%${year}%`]);
    }

    static insertIntoMcTaggingQuestion(database, data) {
        const sql = 'INSERT INTO mc_tagging_questions SET ?';
        return database.query(sql, data);
    }

    static updateMcTaggingStatus(database, expertId, status, questionId) {
        const sql = 'update mc_tagging_questions set expert_id =?, status =? where question_id =?';
        return database.query(sql, [expertId, status, questionId]);
    }

    static getDistinctLanguageForStudentId(database, studentId) {
        const sql = 'SELECT DISTINCT(locale) FROM questions where student_id =?';
        return database.query(sql, [studentId]);
    }

    static getDistinctSubjectsForLanguage(database, studentId, locale) {
        const sql = 'SELECT DISTINCT(subject) FROM questions where student_id =? and locale =?';
        return database.query(sql, [studentId, locale]);
    }

    static getDistinctChaptersForClass(database, questionClass, questionSubject) {
        const sql = 'SELECT  distinct(chapter) FROM mc_course_mapping where class =? and subject =?';
        return database.query(sql, [questionClass, questionSubject]);
    }

    static getDistinctClassesForSubject(database, questionSubject) {
        const sql = 'SELECT  distinct(class) FROM mc_course_mapping where subject =?';
        return database.query(sql, [questionSubject]);
    }

    static getDistinctSubtopicsForChapter(database, questionClass, questionSubject, chapter) {
        const sql = 'SELECT DISTINCT(subtopic) FROM mc_course_mapping WHERE class =? AND subject =? AND chapter =?';
        return database.query(sql, [questionClass, questionSubject, chapter]);
    }

    static getDistinctMicroConceptForSubtopics(database, questionClass, questionSubject, chapter, subtopic) {
        const sql = 'SELECT mc_id,mc_text FROM mc_course_mapping WHERE class =? AND subject =? AND chapter =? AND subtopic =? ORDER BY micro_concept_order;';
        return database.query(sql, [questionClass, questionSubject, chapter, subtopic]);
    }

    static insertQuestionToQuestionsMata(database, data) {
        const sql = 'INSERT into questions_meta set ?';
        return database.query(sql, data);
    }

    static getWatchHistory(database, student_id, limit, offset) {
        // const sql = `SELECT q.*, vvs_count.count FROM questions q LEFT JOIN (select parent_id, question_id, count(view_id) as count from video_view_stats where student_id = ${student_id} and view_from= "SRP" group by parent_id order by view_id desc limit 10) as vvs_count on q.question_id = vvs_count.parent_id WHERE q.student_id = ${student_id} ORDER BY q.question_id DESC LIMIT ${offset},${limit}`;
        // const sql = `SELECT q.*, vvs_count.count, qq.is_text_answered as is_mapped_question_text_answered FROM questions q LEFT JOIN (SELECT vvs.parent_id, vvs.question_id, COUNT(vvs.view_id) AS count FROM video_view_stats vvs JOIN questions q ON q.question_id = vvs.question_id WHERE vvs.student_id = ${student_id} AND vvs.view_from = 'SRP' GROUP BY vvs.parent_id ORDER BY vvs.view_id DESC LIMIT 10) AS vvs_count ON q.question_id = vvs_count.parent_id LEFT JOIN questions qq ON qq.question_id = vvs_count.question_id WHERE q.student_id = ${student_id} ORDER BY q.question_id DESC LIMIT ${offset},${limit}`;
        // const sql = `SELECT q.*, qq.is_text_answered as is_mapped_question_text_answered, vvs.view_id as view_id FROM questions q LEFT JOIN video_view_stats vvs ON q.question_id = vvs.parent_id LEFT JOIN questions qq ON qq.question_id = vvs.question_id LEFT JOIN (SELECT MAX(view_id) AS max_view_id FROM video_view_stats WHERE student_id = ${student_id} AND view_from = 'SRP' GROUP BY parent_id ORDER BY view_id DESC LIMIT 10) AS vvs_temp ON vvs.view_id = vvs_temp.max_view_id WHERE q.student_id = ${student_id} GROUP BY q.question_id ORDER BY q.question_id DESC LIMIT ${offset},${limit}`;
        const sql = 'SELECT CASE WHEN vvs.answer_video = \'text\' THEN 1 ELSE 0 END AS is_mapped_question_text_answered, q.*, qq.is_text_answered, vvs.view_id FROM questions_new q LEFT JOIN video_view_stats vvs ON q.question_id = vvs.parent_id LEFT JOIN questions_new qq ON qq.question_id = vvs.question_id LEFT JOIN (SELECT MAX(view_id) AS max_view_id FROM video_view_stats WHERE student_id = ? AND view_from = \'SRP\' ORDER BY view_id DESC LIMIT 10) AS vvs_temp ON vvs.view_id = vvs_temp.max_view_id WHERE q.student_id = ? GROUP BY q.question_id ORDER BY q.question_id DESC LIMIT ?,?';
        return database.query(sql, [student_id, student_id, offset, limit]);
    }

    static getQuestionAsked(database, student_id, limit, offset) {
        const sql = 'SELECT * FROM questions_new where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND allocated_to <> 10000 AND LENGTH(ocr_text)>0 ORDER BY question_id DESC LIMIT ?, ?';
        return database.query(sql, [student_id, offset, limit]);
    }

    static getQuestionAskedFromArchive(database, student_id, limit, offset) {
        const sql = 'SELECT * FROM questions where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND allocated_to <> 10000 AND LENGTH(ocr_text)>0 ORDER BY question_id DESC LIMIT ?, ?';
        return database.query(sql, [student_id, limit, offset]);
    }

    static getQuestionInfoFromVideoViewStats(database, student_id, questionList) {
        const sql = `SELECT * FROM video_view_stats where student_id = ? and parent_id in (${questionList.join()}) ORDER BY view_id DESC`;
        return database.query(sql, [student_id]);
    }

    static getSimilarQuestionsWatched(database, student_id, question_id) {
        const sql = 'SELECT q.*, vvs_temp.view_id FROM questions_new q JOIN (SELECT question_id, view_id FROM video_view_stats WHERE student_id = ? AND parent_id = ? ORDER BY view_id DESC) AS vvs_temp ON vvs_temp.question_id = q.question_id ORDER BY vvs_temp.view_id DESC LIMIT 10';
        return database.query(sql, [student_id, question_id]);
    }

    static getQuestionFromVideoViewStats(database, student_id, question_id) {
        const sql = 'select question_id from video_view_stats WHERE student_id = ? and parent_id = ?  and  view_from = "SRP" order by view_id desc limit 1';
        return database.query(sql, [student_id, question_id]);
    }

    static getYoutubeStats(database, youtubeQid) {
        const sql = 'SELECT is_click FROM questions_youtube WHERE id = ?';
        return database.query(sql, [youtubeQid]);
    }

    static insertYoutubeStats(database, obj) {
        const sql = 'INSERT INTO questions_youtube SET ?';
        return database.query(sql, [obj]);
    }

    static updateYoutubeStats(database, obj, youtubeQid) {
        const sql = 'UPDATE questions_youtube SET ? WHERE id = ?';
        return database.query(sql, [obj, youtubeQid]);
    }

    static addVoiceSearchQuestion(database, obj) {
        const sql = 'INSERT INTO voice_search_questions SET ?';
        return database.query(sql, [obj]);
    }

    static storeVoiceSearchOcr(database, obj) {
        const sql = 'INSERT INTO voice_search_ocrs SET ?';
        return database.query(sql, [obj]);
    }

    static getDataByPlaylistId(database, playlistId) {
        const sql = 'SELECT * FROM new_library WHERE id = ?';
        return database.query(sql, [playlistId]);
    }

    static getSimilarQuestionsDataByQuery(database, sql) {
        return database.query(sql);
    }

    static getQuestionDataByQuestionId(database, qid) {
        const sql = 'SELECT e.*, f.duration FROM (SELECT c.*, d.book_meta FROM (SELECT a.question_id, a.ocr_text, a.doubt, a.matched_question, a.subject, b.target_course FROM questions AS a LEFT JOIN questions_meta AS b ON a.question_id = b.question_id) AS c LEFT JOIN questions_book_meta AS d ON c.question_id = d.question_id) AS e LEFT JOIN answers AS f on e.question_id = f.question_id WHERE e.question_id = ?';
        return database.query(sql, [qid]);
    }

    static getIconLink(database) {
        const sql = 'SELECT id,subject_name,subject_name_hi,icon_link FROM subject_icon_links WHERE is_active = 1';
        return database.query(sql);
    }

    static getChapterAliasFromChapterName(database, chapter, studentClass, subject) {
        const sql = 'SELECT chapter_alias, hindi_chapter_alias from chapter_alias_all_lang where class = ? and subject = ? and chapter = ?';
        return database.query(sql, [studentClass, subject, chapter]);
    }

    static getDoubtByNewQuestionId(questionId, database) {
        const sql = 'select doubt from questions_new where question_id = ?';
        return database.query(sql, [questionId]);
    }

    static getSecondLastViewedWAQuestionId(studentId, questionId, minEngageTime, database) {
        const sql = 'SELECT vvs.view_id, q.question_id, q.doubt, vvs.created_at FROM video_view_stats vvs INNER JOIN questions_new q ON q.question_id = vvs.parent_id AND q.doubt = \'WHATSAPP\' WHERE vvs.parent_id NOT IN (0,?) AND vvs.engage_time>=? AND vvs.student_id=? ORDER BY vvs.view_id desc LIMIT 1';
        return database.query(sql, [questionId, minEngageTime, studentId]);
    }

    static getLastViewedWAQuestionId(studentId, database) {
        const sql = 'SELECT vvs.view_id, q.question_id, q.doubt, vvs.created_at FROM video_view_stats vvs INNER JOIN questions_new q ON q.question_id = vvs.parent_id AND q.doubt = \'WHATSAPP\' WHERE vvs.parent_id != 0 AND engage_time>0 AND vvs.student_id=? ORDER BY vvs.view_id desc LIMIT 1';
        return database.query(sql, [studentId]);
    }

    static getLastViewedWAQuestionIdByViewId(studentId, viewId, database) {
        const sql = 'SELECT vvs.view_id, q.question_id, q.doubt, vvs.created_at FROM video_view_stats vvs INNER JOIN questions_new q ON q.question_id = vvs.parent_id AND q.doubt = \'WHATSAPP\' WHERE vvs.parent_id != 0 AND view_id != ? AND engage_time>0 AND vvs.student_id=? AND vvs.created_at > SUBTIME(CURRENT_TIMESTAMP,\'1 00:00:00\')  ORDER BY vvs.view_id desc LIMIT 1';
        return database.query(sql, [studentId, viewId]);
    }

    static getOnlyQuestionAsked(database, studentId, limit, offset) {
        const sql = 'SELECT * FROM questions_new where student_id = ? AND doubt NOT LIKE \'%WHATSAPP%\' AND allocated_to <> 10000 AND LENGTH(ocr_text)>0 AND question NOT IN ("askV10", "askV10_sm") AND doubt NOT IN ("WEB","WHATSAPP","WHATSAPP_NT","DESKTOP_VOICE","MWEB_VOICE","desktop","mweb","desktop-us","mweb-us","APP_US") ORDER BY question_id DESC LIMIT ?, ?';
        return database.query(sql, [studentId, offset, limit]);
    }
};
