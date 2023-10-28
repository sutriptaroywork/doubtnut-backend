/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:30:50
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-02 15:39:17
*/

module.exports = class TestQuestions {
    static getAllTestQuestionsByTestSectionCodeAndTestId(database, sectionCode, testId) {
        const params = [];
        params.push(testId);
        params.push(sectionCode);
        let sql = '';
        sql = 'SELECT * FROM testseries_questions WHERE test_id = ? AND section_code = ? AND is_active = 1';
        return database.query(sql, params);
    }

    static getAllTestQuestionsByTestId(database, testId) {
        const params = [];
        params.push(testId);
        let sql = '';
        sql = 'SELECT * FROM testseries_questions WHERE test_id = ? AND is_active = 1';
        return database.query(sql, params);
    }

    static getAllTestQuestionsByTestIdWithData(database, testId) {
        const params = [];
        params.push(testId);
        let sql = '';
        sql = 'SELECT * FROM testseries_questions INNER JOIN testseries_question_bank ON testseries_questions.questionbank_id = testseries_question_bank.id WHERE test_id = ? AND is_active = 1';
        return database.query(sql, params);
    }

    static getAllTestQuestionsByTestSectionCodeAndTestIdWithData(database, testId) {
        const params = [];
        params.push(testId);
        params.push(sectionCode);
        let sql = '';
        sql = 'SELECT testseries_question_bank.type,testseries_question_bank.loc_lang,testseries_question_bank.text,testseries_question_bank.image_url,testseries_question_bank.video_url,testseries_question_bank.audio_url,question_answer.doubtnut_questionid,test_id,section_code,questionbank_id,testseries_questions.difficulty_type,correct_reward,incorrect_reward,is_active,created_on FROM testseries_questions WHERE test_id = ? AND section_code = ? AND is_active = 1 INNER JOIN testseries_question_bank ON testseries_questions.questionbank_id = testseries_question_bank.id';
        return database.query(sql, params);
    }

    static getAllOptionsByQuestionIds(database, questionIdArrayString) {
        let sql = '';
        const questionIdArray = questionIdArrayString.split(',');

        sql = 'SELECT * FROM testseries_question_answers WHERE questionbank_id IN (?)';
        return database.query(sql, [questionIdArray]);
    }

    static getAllOptionsByQuestionIdsWithoutIsAnswer(database, questionIdArrayString) {
        let sql = '';
        const questionIdArray = questionIdArrayString.split(',');
        sql = 'SELECT `option_code`,`questionbank_id`,`title`,`description`,`loc_lang`,`difficulty_type`,`created_on` FROM testseries_question_answers WHERE questionbank_id IN (?)';
        return database.query(sql, [questionIdArray]);
    }

    static getAllCorrectOptionsByQuestionIds(database, questionIdArrayString) {
        let sql = '';
        const questionIdArray = questionIdArrayString.split(',');
        sql = 'SELECT * FROM testseries_question_answers WHERE questionbank_id IN (?) AND is_answer = 1';
        // console.log(sql);
        return database.query(sql, [questionIdArray]);
    }

    static getAllOptionsByQuestionIdsByDifficulty(database, questionIdArrayString, difficulty) {
        const params = [];
        params.push(questionIdArrayString.split(','));
        params.push(difficulty);
        let sql = '';
        sql = 'SELECT * FROM testseries_question_answers WHERE questionbank_id IN (?) AND difficulty_type = ?';
        return database.query(sql, params);
    }

    static insertResult(database, obj) {
        let sql = '';
        sql = 'INSERT INTO testseries_student_results (student_id,test_id,test_subscription_id,questionbank_id,section_code,subject_code,chapter_code,subtopic_code,mc_code,marks,correct_options,response_options,marks_scored,is_correct,is_skipped) VALUES ? ';
        return database.query(sql, [obj]);
    }

    static updateResult(database, obj, testSubscriptionId, questionBankId) {
        console.log(obj);
        const params = [];
        params.push(obj);
        params.push(testSubscriptionId);
        params.push(questionBankId);
        let sql = '';
        sql = 'UPDATE `testseries_student_results` SET ? WHERE `test_subscription_id` =  ? AND `questionbank_id` = ?';
        return database.query(sql, params);
    }
};
