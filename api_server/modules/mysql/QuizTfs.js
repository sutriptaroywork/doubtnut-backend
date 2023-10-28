// mysql :
const Utility = require('../utility');

module.exports = class QuizTfsMysql {
    static insertIntoSessionsTable(database, sessionId, studentId, testQuestionId, date, studentClass, subject, language, answerSelected, ptsReceived, actualAnswer, sessionType) {
        const sql = 'insert ignore into quiztfs_sessions_details(session_id, student_id, test_question_id, date, class, subject, language, answer, pts_received, actual_answer, type) values (?,?,?,?,?,?,?,?,?,?,?)';
        return database.query(sql, [sessionId, studentId, testQuestionId, date, studentClass, subject, language, answerSelected, ptsReceived, actualAnswer, sessionType]);
    }

    static getAttemptedCount(database, yesterday, today, studentID) {
        const sql = 'select count(*) from quiztfs_sessions_details where student_id = ? and date BETWEEN ? and ?';
        return database.query(sql, [studentID, yesterday, today]);
    }

    static getTotalQuestionsAttemped(database, yesterday, today, studentID) {
        const sql = 'SELECT session_id as sessionId, test_question_id as testQuestionId, answer as answerSelected, pts_received as ptsReceived, actual_answer as actualAnswer, type FROM quiztfs_sessions_details where student_id = ? and date BETWEEN ? and ?';
        console.log(studentID, yesterday, today);
        return database.query(sql, [studentID, yesterday, today]);
    }

    static getTotalQuestionsAttempedToday(database, today, studentID) {
        const sql = 'SELECT session_id as sessionId, test_question_id as testQuestionId, answer as answerSelected, pts_received as ptsReceived, actual_answer as actualAnswer, type FROM quiztfs_sessions_details where student_id = ? and date = ?';
        return database.query(sql, [studentID, today]);
    }

    static getQuestionsBySessionAndStudent(database, studentId, sessionId) {
        const sql = 'SELECT test_question_id as testQuestionId, answer as answerSelected, pts_received as ptsReceived, actual_answer as actualAnswer FROM quiztfs_sessions_details WHERE student_id = ? and session_id = ?';
        return database.query(sql, [studentId, sessionId]);
    }

    static getAllAttemptedDatesForStudent(database, studentId, limit, page) {
        const offset = Utility.getOffset(page, limit);
        const sql = 'SELECT date, count(*) as totalQuestions FROM quiztfs_sessions_details where student_id = ? group by date order by date DESC LIMIT ? OFFSET ?';
        return database.query(sql, [studentId, limit, offset]);
    }

    static getAllQuestionsAttemptedForDate(database, studentId, date, limit, page) {
        const offset = Utility.getOffset(page, limit);
        const sql = 'SELECT test_question_id as testQuestionId, answer as answerSelected, pts_received as ptsReceived, actual_answer as actualAnswer, date, class, subject, language FROM quiztfs_sessions_details WHERE student_id=? AND date=? ORDER by created_at desc LIMIT ? OFFSET ?';
        return database.query(sql, [studentId, date, limit, offset]);
    }

    static getFaqs(database, locale, bucket = 'quiztfs') {
        // const bucket = 'quiztfs';
        const sql = 'SELECT * FROM faq WHERE bucket = ? and is_active = 1 and locale = ?';
        return database.query(sql, [bucket, locale]);
    }

    static getAnswerData(database, questionIdlist) {
        const sql = 'SELECT question_id as questionId, is_answered as isAnswered, is_text_answered as isTextAnswered, question FROM questions where question_id in (?)';
        return database.query(sql, [questionIdlist]);
    }

    static getQuestionMetaDataByQid(database, questionIdList) {
        const sql = 'SELECT * from questions_meta WHERE question_id in (?)';
        return database.query(sql, [questionIdList]);
    }

    static getQuestionAttemptedForDateById(database, studentId, date, questionID) {
        const sql = 'SELECT test_question_id as questionID, answer as answerSelected, pts_received as ptsReceived, actual_answer as actualAnswer, date, class, subject, language FROM quiztfs_sessions_details WHERE student_id=? AND date=? and test_question_id = ? ';
        return database.query(sql, [studentId, date, questionID]);
    }

    static getPreviousAchievedRewards(database, studentId, page, limit) {
        const offset = Utility.getOffset(page, limit);
        const sql = 'SELECT * from quiztfs_rewards  where scratch_date < CURRENT_DATE() and student_id = ? ORDER BY scratch_date , milestone_score DESC LIMIT ? OFFSET ?';
        return database.query(sql, [studentId, limit, offset]);
    }

    static getLastRewardWinner(database) {
        const sql = 'SELECT b.student_fname FROM quiztfs_rewards as a left join students as b on a.student_id = b.student_id WHERE DATE(a.scratch_date) = DATE(NOW()) AND a.is_active = 1 order by id desc LIMIT 1';
        return database.query(sql, []);
    }

    static getRedeemedCoupons(database, studentId) {
        const sql = 'select sps.student_id, pi2.coupon_code, ps.created_at from (select * from student_package_subscription where student_id = ?) as sps left join payment_summary ps on sps.id = ps.subscription_id left join payment_info pi2 on ps.txn_id = pi2.partner_txn_id where pi2.coupon_code is not null';
        return database.query(sql, [studentId]);
    }

    static updateRedeemedCoupons(database, studentId, couponCode, limit) {
        const sql = 'UPDATE quiztfs_rewards SET is_redeemed = 1 WHERE student_id = ? and coupon_code = ? ORDER BY scratch_date ASC LIMIT ?';
        return database.query(sql, [studentId, couponCode, limit]);
    }

    static getAllScratchedCoupForStudentToday(database, studentId) {
        const sql = 'SELECT * FROM quiztfs_rewards where DATE(scratch_date) = CURDATE() and student_id = ? ';
        return database.query(sql, [studentId]);
    }

    static getTopThreeSubmitters(database, questionId, date) {
        const sql = 'SELECT a.pts_received, a.created_at, a.student_id, b.student_fname, b.student_lname, b.img_url from quiztfs_sessions_details as a left join students as b on a.student_id=b.student_id where a.test_question_id=? and created_at > ? order by pts_received desc, created_at asc limit 3';
        return database.query(sql, [questionId, date]);
    }

    static getFastestCorrectSubmitterBySessionId(database, questionId, sessionId) {
        const sql = 'SELECT a.pts_received, a.created_at, a.student_id, b.student_fname, b.student_lname, b.img_url from quiztfs_sessions_details as a left join students as b on a.student_id=b.student_id where a.test_question_id=? and session_id = ? and pts_received > 0 order by pts_received desc, created_at asc limit 3';
        return database.query(sql, [questionId, sessionId]);
    }

    static getSubmitStatOnQuestionId(database, questionId, sessionId, studentId) {
        const sql = 'SELECT SUM(1) as submits,SUM(CASE WHEN pts_received > 0 THEN 1 ELSE 0 END) as corrects, SUM(CASE WHEN pts_received = 0 AND answer = \'SKIPPED\' THEN 1 ELSE 0 END) as skipped ,actual_answer,MAX(CASE WHEN student_id = ? THEN answer END) as answer_submitted_by_user,MAX(CASE WHEN student_id = ? THEN pts_received END) as user_point_received from quiztfs_sessions_details where test_question_id=? and session_id = ?';
        return database.query(sql, [studentId, studentId, questionId, sessionId]);
    }

    static getLastQuestionFromSessionAndQuestionId(database, sessionId, currentQuestionId) {
        const sql = 'SELECT created_at, test_question_id as testQuestionId from quiztfs_sessions_details where test_question_id <> ? and session_id = ?  order by created_at DESC limit 1';
        return database.query(sql, [currentQuestionId, sessionId]);
    }

    static isFirstSubmitter(database, studentId, sessionId) {
        const sql = 'SELECT (CASE WHEN student_id = ? THEN 1 ELSE 0 END) as is_first_submit FROM quiztfs_sessions_details WHERE date = CURDATE() and session_id = ? order by created_at asc limit 1';
        return database.query(sql, [studentId, sessionId]);
    }

    static getStudentData(database, studentId) {
        const sql = 'SELECT * from students where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getFollowers(database, studentId) {
        const sql = 'select (user_id) as id, b.*,b.gcm_reg_id as gcmId from user_connections as a left join students as b on a.user_id=b.student_id where a.connection_id = ? and b.gcm_reg_id is not NULL';
        return database.query(sql, [studentId]);
    }
};
