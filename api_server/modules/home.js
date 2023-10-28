// const _ = require('lodash');

const limit = 9;
module.exports = class Home {
    static getQuestionsUsingStudentId(student_id, database) {
        const sql = 'SELECT questions.question_id,questions.ocr_text,questions.question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE student_id =?;';
        return database.query(sql, [student_id]);
    }

    static getMostWatchedQuestions(database) {
        const sql = 'SELECT * FROM (SELECT a.question_id,b.ocr_text,b.matched_question,b.question FROM (SELECT question_id, COUNT(view_id) as total_views FROM video_view_stats GROUP BY question_id ORDER BY total_views DESC LIMIT 10) as a LEFT JOIN (SELECT question_id,ocr_text,question,matched_question FROM questions) as b on b.question_id=a.question_id) as c INNER JOIN questions_meta on questions_meta.question_id=c.question_id LIMIT 10';
        return database.query(sql);
    }

    static getJeeBrowseQuestions(database) {
        const sql = "SELECT questions.question_id,questions.ocr_text,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id = 3 AND doubt LIKE 'JM_18%' and is_answered=1 ORDER BY `doubt` ASC LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getJeeAdvancedBrowseQuestions(database) {
        const sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question ,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=8 and doubt LIKE 'JA%' and is_answered=1  LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getBoardsBrowseQuestions(database) {
        const sql = 'select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=2 and is_answered=1  LIMIT ?';
        return database.query(sql, [limit]);
    }

    static getCengageBrowseQuestions(database) {
        const sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=5 and doubt not like '%RD%' and is_answered=1  LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getRDsharmaBrowseQuestions(database) {
        const sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=4 and doubt like '%RD%' and is_answered=1  LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getTenthBoardsBrowseQuestions(database) {
        const sql = 'select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE student_id=9 and is_answered=1   LIMIT ?';
        return database.query(sql, limit);
    }

    static getJeeMainsBrowseQuestions(database) {
        const sql = "SELECT question_id,ocr_text,question,matched_question FROM questions WHERE student_id = 3 AND doubt LIKE 'JM_18%' and is_answered=1 ORDER BY `doubt` ASC LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getJeeMainsQuestions(database) {
        const sql = "select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions.matched_question ,questions_meta.* FROM questions LEFT JOIN questions_meta ON questions.question_id = questions_meta.question_id  WHERE student_id=3 and doubt LIKE 'JM_18%' and is_answered=1 ORDER BY questions.doubt ASC  LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getNcertBrowseQuestions(database) {
        const sql = 'select questions.question_id,questions.ocr_text,questions.matched_question,questions.question,questions_meta.* FROM questions INNER JOIN questions_meta ON questions.question_id = questions_meta.question_id WHERE student_id=1 and is_answered=1  LIMIT ?';
        return database.query(sql, [limit]);
    }

    static getCengageBrowseLibrary(database) {
        const sql = "select question_id,ocr_text,question from questions WHERE student_id=5 and doubt not like '%RD%' and is_answered=1  LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getNcertBrowseLibrary(limit, database) {
        const sql = 'select question_id,ocr_text,question from  questions WHERE student_id=1 and is_answered=1 order by rand() asc  LIMIT ?';
        return database.query(sql, [limit]);
    }

    static getNcertBrowseLibraryByClass(limit, class1, database) {
        const sql = 'select question_id,ocr_text,question from  questions WHERE student_id=1 and class = ? and is_answered=1 order by rand() asc  LIMIT ?';
        // console.log(sql)
        return database.query(sql, [class1, limit]);
    }

    static getNcertBrowseLibraryByClassWithLanguage(limit, class1, language, database) {
        if (class1 === '14') {
            class1 = '8';
        }
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (select question_id,ocr_text,question from  questions WHERE student_id=1 and class = ? and is_answered=1 order by rand() asc  LIMIT ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        // console.log(sql)
        return database.query(sql, [class1, limit]);
    }

    static getJeeAdvancedBrowseLibrary(limit, database) {
        const sql = "select question_id,ocr_text,question from questions  WHERE student_id=8 and doubt LIKE 'JA%' and is_answered=1 order by rand() asc LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getJeeAdvancedBrowseLibraryWithLanguage(limit, language, database) {
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (select question_id,ocr_text,question from questions  WHERE student_id=8 and doubt LIKE 'JA%' and is_answered=1 order by rand() asc LIMIT ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        return database.query(sql, [limit]);
    }

    static getTenthBoardsBrowseLibrary(limit, database) {
        const sql = 'select question_id,ocr_text,question from questions WHERE student_id=9 and is_answered=1 order by rand() asc LIMIT ?';
        return database.query(sql, [limit]);
    }

    static getTenthBoardsBrowseLibraryWithLanguage(limit, language, database) {
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (select question_id,ocr_text,question from questions WHERE student_id=9 and is_answered=1 order by rand() asc LIMIT ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        return database.query(sql, [limit]);
    }

    static getBoardsBrowseLibrary(limit, database) {
        const sql = 'select question_id,ocr_text,question from questions WHERE student_id=2 and is_answered=1 order by rand() asc LIMIT ?';
        return database.query(sql, [limit]);
    }

    static getBoardsBrowseLibraryWithLanguage(limit, language, database) {
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (select question_id,ocr_text,question from questions WHERE student_id=2 and is_answered=1 order by rand() asc LIMIT ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        return database.query(sql, [limit]);
    }

    static getJeeMainBrowseLibrary(limit, database) {
        const sql = "select question_id,ocr_text,question from questions WHERE student_id = 3 AND doubt LIKE 'JM_18%' and is_answered=1 ORDER BY `doubt` ASC LIMIT ?";
        return database.query(sql, [limit]);
    }

    static getJeeMainBrowseLibraryWithLanguage(limit, language, database) {
        const sql = `select a.question_id,a.question, case when b.${language} is null then a.ocr_text else b.${language} end as ocr_text from (select question_id,ocr_text,question from questions WHERE student_id = 3 AND doubt LIKE 'JM_18%' and is_answered=1 ORDER BY \`doubt\` ASC LIMIT ?) as a left join (select question_id,${language} from questions_localized) as b on a.question_id=b.question_id`;
        return database.query(sql, [limit]);
    }
};
