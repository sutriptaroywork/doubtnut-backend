module.exports = class HomepageQuestionsMaster {
    static getPersonalisedQuestionData(database, widgetType, studentId, sClass, subject, chapter, limit) {
        // eslint-disable-next-line prefer-template
        const sql = 'select * from ((SELECT id,question_id as qid,widget_name,class,subject,chapter FROM homepage_questions_master where widget_name =? and is_active=1) as a inner join (select question_id ,is_answered,is_text_answered from questions) as c on a.qid = c.question_id  inner join (select answer,question_id from text_solutions  ) as b on a.qid = b.question_id left join (select question_id,response as submission,student_id from home_widget_submissions where student_id =?) as d on d.question_id = a.qid ) where a.class=?  and a.chapter =?  and d.submission is NULL order by rand() desc LIMIT ?';
        return database.query(sql, [widgetType, studentId, sClass, chapter, limit]);
    }

    static getPersonalisedQuestionDataNew(database, widgetType, studentId, sClass, subject, chapter, limit) {
        const sql = 'select * from ((SELECT id,question_id as qid,widget_name,class,subject,chapter, master_chapter_alias FROM homepage_questions_master where widget_name =? and is_active=1) as a inner join (select question_id ,is_answered,is_text_answered from questions) as c on a.qid = c.question_id  inner join (select answer,question_id from text_solutions where answer IN (\'a\',\'b\',\'c\',\'d\',\'A\',\'B\',\'C\',\'D\')) as b on a.qid = b.question_id left join (select question_id,response as submission,student_id from home_widget_submissions where student_id =?) as d on d.question_id = a.qid ) where a.class=? and a.master_chapter_alias =? and d.submission is NULL order by rand() desc LIMIT ?';
        return database.query(sql, [widgetType, studentId, sClass, chapter, limit]);
    }

    static getClassChapter(database, qid) {
        const sql = 'SELECT c.*, d.master_chapter_alias FROM (SELECT a.class AS class, a.subject AS subject, CASE WHEN b.chapter IS NOT NULL THEN b.chapter ELSE a.chapter END AS chapter FROM questions AS a LEFT JOIN questions_meta AS b ON a.question_id = b.question_id WHERE a.question_id = ?) AS c LEFT JOIN homepage_questions_master AS d ON c.class=d.class AND c.subject=d.subject AND c.chapter=d.chapter WHERE d.widget_name = "TOPIC_BOOSTER"';
        return database.query(sql, [qid]);
    }

    static getChapterAlias(database, questionId) {
        const sql = 'select chapter_alias, q.chapter from questions q join chapter_alias_all_lang c on q.chapter=c.chapter where q.question_id=? limit 1';
        return database.query(sql, [questionId]).then((res) => res[0]);
    }

    static getTotalCountTopicBooster(database, chapterAlias) {
        const sql = `select count(*) as total from (SELECT 1 from (SELECT question_id, class, chapter, subject, ocr_text
                              from questions
                              where is_answered = 1 and is_text_answered = 1 and student_id < 100 and ocr_text !='') as a
                                 left join
                             (select question_id, opt_1, opt_2, opt_3, opt_4, answer
                              from text_solutions
                              where opt_1 is not null
                                and opt_2 is not null
                                and answer is not null) as b
                             on a.question_id = b.question_id
                                 left join
                             (select chapter, chapter_alias, class, subject from chapter_alias_all_lang) as c
                             on a.chapter = c.chapter
                        where a.class = c.class
                          and a.subject = c.subject
                          and chapter_alias = ?
                          and opt_1 != ''
                          and opt_2 != ''
                          and answer IN ('a', 'b', 'c', 'd') limit 10) as result`;
        return database.query(sql, [chapterAlias]).then((res) => res[0]);
    }

    static getTopicBoosterQuestions(database, chapterAlias) {
        const sql = `SELECT a.question_id as question_id,
                           a.class       as class,
                           a.chapter     as chapter,
                           a.ocr_text    as question_text,
                           b.opt_1       as opt_1,
                           b.opt_2       as opt_2,
                           b.opt_3       as opt_3,
                           b.opt_4       as opt_4,
                           b.answer      as answer,
                           a.subject     as subject
                    from (SELECT question_id, class, chapter, subject, ocr_text
                          from questions
                          where is_answered = 1 and is_text_answered = 1
                            and student_id < 100 and ocr_text !='' ) as a
                             left join
                         (select question_id, opt_1, opt_2, opt_3, opt_4, answer
                          from text_solutions
                          where opt_1 is not null
                            and opt_2 is not null
                            and answer is not null) as b
                         on a.question_id = b.question_id
                             left join
                         (select chapter, chapter_alias, class, subject from chapter_alias_all_lang) as c
                         on a.chapter = c.chapter
                    where a.class = c.class
                      and a.subject = c.subject
                      and chapter_alias = ?
                      and opt_1 != ''
                      and opt_2 != ''
                      and answer IN ('a', 'b', 'c', 'd')
                    limit 5000`;
        return database.query(sql, [chapterAlias]);
    }

    static getClassChapterDetails(database, qid) {
        const sql = 'SELECT a.class AS class, a.subject AS subject, CASE WHEN b.chapter IS NOT NULL THEN b.chapter ELSE a.chapter END AS chapter FROM questions AS a LEFT JOIN questions_meta AS b ON a.question_id = b.question_id WHERE a.question_id = ?';
        return database.query(sql, [qid]);
    }

    static getTotalCredited(database, studentId, totalDay) {
        const sql = `SELECT SUM(amount) as total
                        FROM wallet_transaction
                        WHERE reason = 'add_topic_booster_reward'
                          AND student_id = ?
                          AND created_at BETWEEN NOW() - INTERVAL ? DAY AND NOW()`;
        return database.query(sql, [studentId, totalDay]);
    }

    static getLastWatchedSRPQuestionId(database, studentId, fromDate, toDate) {
        const sql = `SELECT question_id FROM video_view_stats WHERE student_id=? AND view_from='SRP' and created_at BETWEEN
         ? and ? ORDER BY view_id DESC LIMIT 1`;
        return database.query(sql, [studentId, fromDate, toDate]);
    }

    static getClassChapterForAskedQuestions(database, qid, chapter) {
        const sql = 'SELECT c.*, d.master_chapter_alias FROM (SELECT class, subject, chapter FROM questions_new WHERE question_id = ?) AS c LEFT JOIN homepage_questions_master AS d ON c.class = d.class AND c.subject = d.subject WHERE d.widget_name = "TOPIC_BOOSTER" AND d.chapter = ?';
        return database.query(sql, [qid, chapter]);
    }

    static getClassChapterForAskedQuestionsOld(database, qidList) {
        const sql = `SELECT * FROM homepage_questions_master WHERE question_id IN (${qidList})`;
        return database.query(sql);
    }

    static getChapterAliasByChapter(database, chapter) {
        const sql = 'SELECT q.question_id, c.* FROM questions q RIGHT JOIN chapter_alias_all_lang c ON q.chapter = c.chapter WHERE q.chapter = ? LIMIT 5';
        return database.query(sql, [chapter]);
    }

    static getClassChapterDetailsForDoubtfeed(database, qid) {
        const sql = 'SELECT class, subject, chapter FROM questions WHERE question_id = ?';
        return database.query(sql, [qid]);
    }
};
