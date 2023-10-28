module.exports = class practiceCornerMySql {
    static getQuestionData(qidArray, database) {
        const sql = `SELECT question_id, original_ocr_text, question_image from questions WHERE question_id IN (${qidArray}) ORDER BY FIELD (question_id, ${qidArray})`;
        return database.query(sql);
    }

    static getQuestionsByChapter(database, studentClass, topic) {
        const sql = `SELECT distinct a.question_id,a.opt_1,a.opt_2,a.opt_3,a.opt_4,b.subject,c.chapter,a.answer, b.ocr_text as question_text
                    from (SELECT * from text_solutions where opt_1 != '' and opt_2 != '' and opt_3 != '' and opt_4 != '' AND LOWER(answer) IN ('a', 'b', 'c', 'd')) as a
                    LEFT JOIN (SELECT question_id, chapter, class, subject, ocr_text from questions where student_id < 100 and class = ?) as b
                        ON a.question_id = b.question_id left JOIN (SELECT * from chapter_alias_all_lang WHERE chapter_alias = ?) as c
                        ON b.chapter = c.chapter WHERE c.chapter_alias is not null limit 500`;
        return database.query(sql, [studentClass, topic]);
    }

    static getQuestionsByQids(database, qids) {
        const sql = `SELECT a.question_id,a.opt_1,a.opt_2,a.opt_3,a.opt_4,a.answer, b.ocr_text as question_text
                    from (SELECT * from text_solutions where opt_1 != '' and opt_2 != '' and opt_3 != '' and opt_4 != '' AND LOWER(answer) IN ('a', 'b', 'c', 'd')) as a
                     JOIN (SELECT question_id, ocr_text from questions where question_id in (?)) as b
                        ON a.question_id = b.question_id  ORDER BY FIELD(a.question_id, ?)`;
        return database.query(sql, [qids, qids]);
    }

    static getVideoTextSolutions(database, qids) {
        const sql = 'select question_id, is_answered, is_text_answered from questions where question_id in (?) ORDER BY FIELD(question_id, ?)';
        return database.query(sql, [qids, qids]);
    }

    static getFormulaDeckData(database, student_class) {
        const sql = 'SELECT id, level1, level2, location, img_url FROM pdf_download WHERE package = \'FORMULA SHEET\' AND status = 1 AND class = ?';
        return database.query(sql, [student_class]);
    }

    static getAptitudeTestId(database) {
        const sql = 'select  test_id from testseries where chapter_code =\'APTITUDE QUESTIONS\'  and is_active=1 and is_free=1 order by rand() limit 1';
        return database.query(sql);
    }

    static getAptitudeQuestions(database, testId) {
        const sql = 'select test_id, q.questionbank_id, subject_code, text, title, is_answer from testseries_questions q join testseries_question_bank b on q.questionbank_id = b.id join testseries_question_answers ans on ans.questionbank_id = b.id where q.test_id = ?';
        return database.query(sql, [testId]);
    }

    static aptitudeQuestionsDataBasesOnQid(database, qids) {
        const sql = 'select test_id, q.questionbank_id, subject_code, text, title, is_answer from testseries_questions q join testseries_question_bank b on q.questionbank_id = b.id join testseries_question_answers ans on ans.questionbank_id = b.id where q.questionbank_id in (?) ORDER BY FIELD(q.questionbank_id, ?)';
        return database.query(sql, [qids, qids]);
    }

    static getHomeCarousels(database) { // 33.2ms
        const sql = 'select carousel_type, priority from revision_corner_carousels where is_active = 1';
        return database.query(sql);
    }

    static getTestsbyExam(database, examName, studentClass, start, limit) { // 32.8ms
        const sql = 'select test_id, title from testseries where test_id in (select test_id from revision_corner_tests where category = ? and is_active = 1 and (class = ? or class = 0)) LIMIT ? OFFSET ?';
        return database.query(sql, [examName, studentClass, limit, start]);
    }

    static getPreviousPapers(database, examName, start, limit) { // 38.0ms
        let sql = 'select pdf_url, state_board, year_chapter, subject from boards_previous_year where state_board = ? group by subject,year_chapter order by year_chapter DESC LIMIT ? OFFSET ?';
        if (examName == 'NDA I PREVIOUS YEAR PAPER') {
            sql = 'select pdf_url, state_board, year_chapter, subject from boards_previous_year where state_board = ? order by year_chapter DESC LIMIT 1';
        }
        return database.query(sql, [examName, limit, start]);
    }

    static getStudentCourse(database, studentId) { // 39.3ms
        const sql = 'select ccm.id, course,category from student_course_mapping scm join class_course_mapping ccm on ccm.id = scm.ccm_id where scm.student_id = ? and ccm.category in ("exam","board")';
        return database.query(sql, [studentId]);
    }

    static getQidByChapter(database, chapter, studentClass, lang) { // 119ms
        const sql = 'select g.resource_reference, a.course_resource_id from (select * from course_resource_mapping where name = ? and schedule_type=\'scheduled\' and is_replay=0 and resource_type=\'assortment\') as a inner join (select * from course_details where is_active=1 and assortment_type=\'chapter\') as b on a.course_resource_id=b.assortment_id inner join (select * from course_resource_mapping where resource_type=\'assortment\') as c on a.assortment_id=c.course_resource_id inner join (select * from course_details where is_active=1) as d on c.assortment_id=d.assortment_id inner join (select * from course_resource_mapping where resource_type=\'assortment\') as e on a.course_resource_id=e.assortment_id inner join (select * from course_resource_mapping where resource_type=\'resource\') as f on e.course_resource_id=f.assortment_id inner join (select * from course_resources) as g on f.course_resource_id=g.id where d.class= ? and d.meta_info= ? and g.resource_type in (1,4,8) order by a.id desc limit 1';
        return database.query(sql, [chapter, studentClass, lang]);
    }
};
