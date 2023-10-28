module.exports = class PracticeEnglishMySql {
    static getQuestionIdsList(db) {
        // should never use order by RAND()
        // const sql = 'select q.question_id, ts.type as question_type from questions q left join text_solutions ts on q.question_id = ts.question_id WHERE q.student_id = ? ORDER BY RAND() LIMIT 0,10';
        const sql = 'select q.question_id, ts.type as question_type from questions q left join text_solutions ts on q.question_id = ts.question_id WHERE q.student_id = -501 and q.is_skipped = 0 and ts.type not in ("translate_hi","translate_en")';
        return db.query(sql, []);
    }

    static getQuestionIdsListByDifficulty(db, difficulty) {
        const sql = 'select q.question_id, ts.type as question_type from questions q left join text_solutions ts on q.question_id = ts.question_id WHERE q.student_id = -501 and q.difficulty = ? and q.is_skipped = 0 and ts.type not in ("translate_hi","translate_en")';
        return db.query(sql, [difficulty]);
    }

    static getQuestionById(db, questionId) {
        const sql = 'select q.question_id, ts.type as question_type, q.difficulty, q.question, q.question_image as question_image_url, ts.answer as text_answer, ts.opt_1, ts.opt_2, ts.opt_3, ts.opt_4, ts.solutions, ts.tag1 as question_audio, ts.tag2 as answer_audio from questions q left join text_solutions ts on q.question_id = ts.question_id  WHERE q.question_id = ? and q.student_id = -501';
        return db.query(sql, [questionId]);
    }

    static getPrevSavedAnswerCount(db, questionId, studentId) {
        const sql = 'select count(*) as previous_attempts from practice_english_responses where question_id = ? and student_id = ?';
        return db.query(sql, [questionId, studentId]);
    }

    static getPreviousAttemptedAll(db, studentId) {
        const sql = 'select distinct question_id from practice_english_responses where student_id = ?';
        return db.query(sql, [studentId]);
    }

    static getPreviousAttemptedQuesCountByDate(db, studentId, startAt) {
        const sql = 'select count(distinct question_id) as attempted_questions from practice_english_responses where student_id = ? and created_at > ?';
        return db.query(sql, [studentId, startAt]);
    }

    static getPreviousAttemptedByDate(db, studentId, startAt) {
        const sql = 'select distinct question_id from practice_english_responses where student_id = ? and created_at > ?';
        return db.query(sql, [studentId, startAt]);
    }

    static getPreviousAttemptedBySession(db, studentId, sessionId) {
        const sql = 'select distinct question_id from practice_english_responses where student_id = ? and session_id = ?';
        return db.query(sql, [studentId, sessionId]);
    }

    static getAttemptedQuesByTimeRange(db, studentId, startDate) {
        const sql = 'select count(*) as attempted_questions from practice_english_responses where student_id = ? and created_at > ?';
        return db.query(sql, [studentId, startDate]);
    }

    static getSessionsByTimeRange(db, studentId, startDate, endDate) {
        const sql = 'select count(*) as attempted_sessions from practice_english_sessions where student_id = ? and status = 1 and created_at > ? and created_at < ? and session_id not in (?)';
        return db.query(sql, [studentId, startDate, endDate, studentId]);
    }

    static getStartedSessionsBySessionId(db, studentId) {
        const sql = 'select count(*) as attempted_sessions from practice_english_sessions where student_id = ? and status in (0,1) and session_id not in (?)';
        return db.query(sql, [studentId, studentId]);
    }

    static getAttemptedQuestionsBySession(db, sessionId) {
        // const sql = 'select distinct question_id, per.* from practice_english_responses as per where student_id = ? and session_id = ?';
        // const sql = 'select id, question_id , max(attempt_no), match_percent from practice_english_responses as per where student_id = ? and session_id = ? GROUP  by question_id';
        const sql = 'SELECT per.id, per.attempt_no, per.match_percent from practice_english_responses per inner join (select id,session_id, question_id, max(attempt_no) as max_attempt from practice_english_responses where session_id = ? GROUP by question_id) per2 on per.session_id = per2.session_id and per.question_id = per2.question_id and per.attempt_no = per2.max_attempt';

        return db.query(sql, [sessionId]);
    }

    static getPreviousSuccessSession(db, studentId, startDate) {
        const sql = 'select * from practice_english_sessions pes where pes.student_id = ? and pes.status = 1 and pes.created_at > ? and pes.is_success = 1';
        return db.query(sql, [studentId, startDate]);
    }

    // insert methods
    static addQuestion(db, studentId, chapter, difficulty, question, questionImage) {
        const sql = 'insert into questions set student_id = ?, class = \'all\', subject = \'Practice English\', book = \'\', chapter = ?, question = ?, difficulty = ?, doubt = \'NONE\', question_image = ?, ocr_text = ?';
        return db.query(sql, [studentId, chapter, question, difficulty, questionImage, question]);
    }

    static addTextSolution(db, questionId, questionType, option1, option2, option3, option4, textAnswer, questionAudio, answerAudio, solution) {
        const sql = 'insert into text_solutions set question_id = ?, type = ?, opt_1 = ?, opt_2 = ?, opt_3 = ?, opt_4 = ?, answer = ?, tag1 = ?, tag2 = ?, solutions = ?, subtopic = \'\'';
        return db.query(sql, [questionId, questionType, option1, option2, option3, option4, textAnswer, questionAudio, answerAudio, solution]);
    }

    static updateQuestionById(db, questionId, question) {
        const sql = 'update questions set question = ?, ocr_text = ?, updated_at = CURRENT_TIMESTAMP where question_id = ?';
        return db.query(sql, [question, question, questionId]);
    }

    static updateTextSolutionsById(db, questionId, option1, option2, option3, option4, textAnswer, questionAudio, answerAudio, solution) {
        const sql = 'update text_solutions set opt_1 = ?, opt_2 = ?, opt_3 = ?, opt_4 = ?, answer = ?, tag1 = ?, tag2 = ?, solutions = ? where question_id = ?';
        return db.query(sql, [option1, option2, option3, option4, textAnswer, questionAudio, answerAudio, solution, questionId]);
    }

    static saveStudentSession(db, studentId, sessionId, status, source = null) {
        const sql = 'insert into practice_english_sessions set student_id = ?, session_id = ?, status = ?, source = ?';
        return db.query(sql, [studentId, sessionId, status, source]);
    }

    static getLatestLandingSession(db, studentId) {
        const sql = 'select session_id from practice_english_sessions where student_id = ? and status = -1 order by created_at desc limit 1';
        return db.query(sql, [studentId]);
    }

    static updateStudentSession(db, sessionId, status) {
        const sql = 'update practice_english_sessions set status = ? where session_id = ?';
        return db.query(sql, [status, sessionId]);
    }

    static endStudentSession(db, studentId, sessionId, status, isSuccess) {
        const sql = 'update practice_english_sessions set status = ?, is_success = ? where student_id = ? and session_id = ?';
        return db.query(sql, [status, isSuccess, studentId, sessionId]);
    }

    static saveTranscription(db, transcriptObj) {
        const sql = 'INSERT INTO practice_english_transcriptions set student_id = ?, audio_url = ?, text = ?, locale = ?';
        return db.query(sql, [transcriptObj.student_id, transcriptObj.audio_url, transcriptObj.text, transcriptObj.locale]);
    }

    static saveAnswer(db, responseObj) {
        const sql = 'INSERT INTO practice_english_responses set question_id = ?, student_id = ?, input_received = ?, correct_tokens = ?, incorrect_tokens = ?, match_percent = ?, attempt_no = ?, session_id = ?';
        return db.query(sql, [responseObj.question_id, responseObj.student_id, responseObj.input_received, responseObj.correct_tokens, responseObj.incorrect_tokens, responseObj.match_percent, responseObj.attempt_no, responseObj.session_id]);
    }

    static saveAudioData(db, audioObj) {
        const sql = 'INSERT INTO practice_english_user_audios set question_id = ?, student_id = ?, audio_url = ?, attempt_no = ?';
        return db.query(sql, [audioObj.question_id, audioObj.student_id, audioObj.audio_url, audioObj.attempt_no]);
    }

    // admin panel methods
    static getAllQuestions(db, questionId, question, questionType, pageSize, pageNumber) {
        let subquery = '';
        if (questionId) {
            subquery += ` and a.question_id = ${questionId}`;
        }
        if (question) {
            subquery += ` and a.question like '%${question}%'`;
        }
        if (questionType) {
            subquery += ` and a.question_type like '%${questionType}%'`;
        }
        const sql = `select * from (select q.question_id, q.student_id, ts.type as question_type, q.question, q.is_skipped, q.question_image, q.timestamp, ts.answer as text_answer, ts.opt_1, ts.opt_2, ts.opt_3, ts.opt_4, ts.solutions, ts.tag1 as question_audio, ts.tag2 as answer_audio from questions q left join text_solutions ts on q.question_id = ts.question_id  WHERE q.student_id = -501 order by q.timestamp desc) as a where a.student_id = -501 ${subquery} limit ? offset ?`;
        return db.query(sql, [pageSize, pageSize * pageNumber]);
    }

    static skipQuestion(db, questionId, skip) {
        const sql = 'update questions set is_skipped = ?, updated_at = CURRENT_TIMESTAMP where question_id = ?';
        return db.query(sql, [skip, questionId]);
    }
};
