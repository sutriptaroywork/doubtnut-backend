module.exports = class QuizWeb {
    static getQuestionsForQuizWeb(database, studentClass, subject, chapter, language) {
        const sql = '';
        return database.query(sql, [studentClass, subject, chapter, language]);
    }

    static closeActiveQuizesOnWhatsapp(database, studentId, source) {
        const sql = 'UPDATE quiz_web_details SET  is_completed = 1 where student_id = ? and is_completed = 0 and source = ?';
        return database.query(sql, [studentId, source]);
    }

    static getQuestionDetailsFromTextSolutions(database, questionIds, limit) { // * 60ms
        let sql;
        let params;
        if (limit) {
            sql = 'select a.question_id, a.opt_1, a.opt_2, a.opt_3, a.opt_4, a.answer, b.question, b.is_answered, b.is_text_answered, b.ocr_text, a.solutions, b.subject, c.answer_id, d.canonical_url from text_solutions a left join questions b on a.question_id = b.question_id left join answers c on a.question_id = c.question_id left join web_question_url d on a.question_id = d.question_id where a.question_id in (?) group by a.question_id order by RAND() limit ?';
            params = [questionIds, limit];
        } else {
            sql = 'select a.question_id, a.opt_1, a.opt_2, a.opt_3, a.opt_4, a.answer, b.question, b.is_answered, b.is_text_answered, b.ocr_text, a.solutions, b.subject, c.answer_id, d.canonical_url from text_solutions a left join questions b on a.question_id = b.question_id left join answers c on a.question_id = c.question_id left join web_question_url d on a.question_id = d.question_id where a.question_id in (?) group by a.question_id order by RAND()';
            params = [questionIds];
        }
        return database.query(sql, params);
    }

    static getAnswerFromTextSolutionsTable(database, questionId) { // * 70ms
        const sql = 'select answer from text_solutions where question_id in (?)';
        return database.query(sql, [questionId]);
    }

    static insertIntoQuizWebDetailsTable(database, sessionId, studentId, isCompleted, questions, studentClass, subject, chapter, language, source) {
        const sql = 'insert into quiz_web_details(session_id, student_id, is_completed, questions, class, subject, chapter, language, source) values (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        return database.query(sql, [sessionId, studentId, isCompleted, questions, studentClass, subject, chapter, language, source]);
    }

    static insertIntoQuizWebLogsDetailsTable(database, sessionId, studentId, questionId, optionSelected, isCorrect, answer) {
        const sql = 'insert into quiz_web_details_logs(session_id, student_id, question_id, selected_option, is_correct, correct_option) values (?, ?, ?, ?, ?, ?)';
        return database.query(sql, [sessionId, studentId, questionId, optionSelected, isCorrect, answer]);
    }

    static updateQuizWebDetailsTable(database, sessionId, studentId) {
        const sql = 'update quiz_web_details set is_completed = 1 where session_id = ? and student_id = ?';
        return database.query(sql, [sessionId, studentId]);
    }

    static getLastTestDetails(database, studentId, studentClass, subject, chapter, language) { // * 45ms
        const sql = 'select * from quiz_web_details where student_id = ? and class = ? and subject = ? and chapter = ? and language = ? order by created_at desc';
        return database.query(sql, [studentId, studentClass, subject, chapter, language]);
    }

    static getTestDetails(database, questions) { // * 80ms
        const sql = 'select a.class, a.subject, c.chapter_alias as chapter, d.package_language, b.question_id, b.opt_1, b.opt_2, b.opt_3, b.opt_4, b.answer from questions a left join text_solutions b on a.question_id = b.question_id left join chapter_alias_all_lang c on a.class = c.class and a.chapter = c.chapter left join studentid_package_mapping_new d on a.student_id = d.student_id where a.student_id < 100 and b.question_id in (?)';
        return database.query(sql, [questions]);
    }

    static getAttemptedQuestions(database, studentId, questions) { // * 77ms
        const sql = 'select question_id from quiz_web_details_logs where student_id = ? and question_id in (?) group by question_id';
        return database.query(sql, [studentId, questions]);
    }

    static getSelectedAnswerFromSession(database, sessionId, studentId, questionId) { // * 50ms
        const sql = 'select selected_option from quiz_web_details_logs where session_id = ? and student_id = ? and question_id = ? order by created_at desc';
        return database.query(sql, [sessionId, studentId, questionId]);
    }

    static getQuizDetailsFromSessionId(database, sessionId) {
        const sql = 'select * from quiz_web_details where session_id = ?';
        return database.query(sql, [sessionId]);
    }
};
