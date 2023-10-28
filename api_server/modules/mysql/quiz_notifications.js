// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

module.exports = class QuizNotificationMySql {
    static getQuizNotificationData(database) {
        const sql = 'select * from quiz_notifications where is_active = 1 ORDER BY day';
        return database.query(sql);
    }

    static getLastDayTestId(student_class, from_time, to_time, database) {
        const sql = `select test_id from testseries t where app_module='QUIZ' and class_code='${this.student_class}' and
                             publish_time between ? and ? order by test_id desc`;
        return database.query(sql, [from_time, to_time]);
    }

    static getTrickyVideo(student_class, database) {
        const sql = 'select question_id, matched_question, ocr_text from questions where student_id=100 and class=? ORDER BY RAND() LIMIT 1';
        return database.query(sql, [student_class]);
    }

    static getToppersVideo(database) {
        const sql = 'select question_id, matched_question, ocr_text from questions where student_id=93 ORDER BY RAND() LIMIT 1';
        return database.query(sql);
    }

    static getLFD(student_class, database) {
        const sql = 'select question_id, ocr_text from questions where student_id=80 and class=? ORDER BY RAND() LIMIT 1';
        return database.query(sql, [student_class]);
    }

    static getMotivationalVideo(database) {
        const sql = 'select question_id, ocr_text from questions where student_id=94 ORDER BY RAND() LIMIT 1';
        return database.query(sql);
    }

    static getTrendingFeedPost(post_date, student_class, database) {
        const sql = `select image_url, question_id from pinned_post where date(start_date) = ? and is_active =1 and class= ? order
                    by rand() limit 1`;
        return database.query(sql, [post_date, student_class]);
    }

    static getTrendingGame(database) {
        const sql = 'select id, title, image_url, profile_image, fallback_url from games where is_active=1 order by profile_order limit 1';
        return database.query(sql);
    }

    static getUpcomingTestId(student_class, database) {
        const sql = `select test_id from testseries t where class_code=? and app_module = 'QUIZ' and is_active=1
        order by publish_time desc limit 1`;
        return database.query(sql, [student_class]);
    }

    static getLastWatchedVideo(student_id, database) {
        const sql = `select question_id from video_view_stats where video_view_stats.source = 'android' and
        view_from in ('SRP_PLAYLIST', 'NON_SRP_PLAYLIST', 'RECOMENDED_PLAYLIST') and student_id=? order by view_id desc limit 1`;
        return database.query(sql, [student_id]);
    }

    static getQuestionByTestId(test_id, database) {
        const sql = 'select questionbank_id, text as question_text from testseries_questions q join testseries_question_bank b on q.questionbank_id = b.id where q.test_id=? limit 1';
        return database.query(sql, [test_id]);
    }

    static getJeeVideo(jee_id, database) {
        const sql = 'select question_id, ocr_text from questions where student_id = ? order by question_id desc, rand() limit 1';
        return database.query(sql);
    }

    static getQuizOptions(questionbank_id, database) {
        const sql = 'select title from testseries_question_answers where questionbank_id=?';
        return database.query(sql, [questionbank_id]);
    }


    static getTrendingLiveClass(student_class, live_at, database) {
        const sql = `select count(r.resource_reference) as total, r.resource_reference as question_id from
         course_resource_mapping c join course_resources r on c.course_resource_id = r.id where c.resource_type = 'resource'
          and r.class = ? and r.resource_type='4' and date(c.live_at) = ? group by r.resource_reference
           order by total desc limit 1`;
        return database.query(sql, [student_class, live_at]);
    }

    static isTrendingClassMissed(resource_id, student_id, database) {
        const sql = 'SELECT EXISTS(SELECT * FROM video_view_stats WHERE question_id=? and student_id=?) as watched';
        return database.query(sql, [resource_id, student_id]);
    }

    static getQuizWinners(student_class, from_time, to_time, database) {
        const sql = `select t.test_id, r.eligiblescore, r.student_id, r.created_at as test_submitted_at,
        s.student_fname, s.student_lname, s.img_url from testseries t join testseries_student_reportcards r
        on t.test_id = r.test_id join students s on s.student_id = r.student_id where t.app_module='QUIZ' and
        t.class_code=? and t.publish_time between ? and ? order by r.eligiblescore desc, r.created_at asc limit 3`;
        return database.query(sql, [student_class, from_time, to_time]);
    }

    static getReferEarnData(student_id, database) {
        const sql = `SELECT a.*, b.id AS payment_info_id, c.student_id as referrer_student_id
                    FROM (SELECT * FROM students_pre_applied_coupons WHERE student_id = ? ORDER BY id DESC LIMIT 1) AS a
                             LEFT JOIN (SELECT * FROM payment_info WHERE status = 'SUCCESS' AND student_id = ?) AS b
                                       ON a.coupon_code = b.coupon_code LEFT JOIN (select * from student_referral_course_coupons where student_id <> ?) AS c ON a.coupon_code = c.coupon_code`;
        return database.query(sql, [student_id, student_id, student_id]);
    }

    static getOcrText(question_id, database) {
        const sql = 'select ocr_text from questions where question_id=?;';
        return database.query(sql, [question_id]);
    }
};
