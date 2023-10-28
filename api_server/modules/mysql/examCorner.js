module.exports = class ExamCorner {
    // gets exam_corner articles which are not of popular carousel type for studentId's ccm id and filterType = news or careers
    static getFeedForHome(database, ccmIds, studentLocale, studentClass, filterTypes, limit) {
        const sql = `SELECT title,
        exam_corner.ccm_id                                AS ccm_id,
        exam_corner.id                                    AS exam_corner_id,
        filter_type,
        start_date,
        exam_corner.class,
        exam_corner.locale,
        IF(is_live && ( live_expiry_date > Now() ), 1, 0) AS is_live,
        carousel_type,
        exam_corner.question_id,
        image_url,
        button_cta_deeplink,
        button_text,
        deeplink,
        course,
        Max(answer_id)                                    AS answer_id
 FROM   exam_corner
        LEFT JOIN class_course_mapping
               ON ccm_id = class_course_mapping.id
        LEFT JOIN questions
               ON ( exam_corner.question_id = questions.question_id )
        LEFT JOIN answers
               ON ( exam_corner.question_id = answers.question_id )
 WHERE  ( exam_corner.ccm_id IN (?)
           OR exam_corner.ccm_id IS NULL )
        AND (exam_corner.class = ? or exam_corner.class = 0)
        AND filter_type in (?)
        AND exam_corner.is_active
        AND start_date < Now()
        AND end_date > Now()
        AND carousel_type != 'popular'
        AND (exam_corner.locale = 'all' or exam_corner.locale = ?)
 GROUP  BY exam_corner.id,
           start_date
 ORDER  BY start_date DESC
 LIMIT  ?`;// around 50-60 ms
        return database.query(sql, [ccmIds.join(), studentClass, filterTypes, studentLocale, limit]);
    }

    static getFeed(database, ccmIds, studentClass, studentLocale, filterType, limit, offset) {
        const sql = `SELECT title,
        exam_corner.ccm_id                                AS ccm_id,
        exam_corner.id                                    AS exam_corner_id,
        filter_type,
        start_date,
        exam_corner.class,
        exam_corner.locale,
        IF(is_live && ( live_expiry_date > Now() ), 1, 0) AS is_live,
        carousel_type,
        exam_corner.question_id,
        image_url,
        button_cta_deeplink,
        button_text,
        deeplink,
        course,
        Max(answer_id)                                    AS answer_id
 FROM   exam_corner
        LEFT JOIN class_course_mapping
               ON ccm_id = class_course_mapping.id
        LEFT JOIN questions
               ON ( exam_corner.question_id = questions.question_id )
        LEFT JOIN answers
               ON ( exam_corner.question_id = answers.question_id )
 WHERE  ( exam_corner.ccm_id IN (?)
           OR exam_corner.ccm_id IS NULL )
           AND (exam_corner.class =  ? or exam_corner.class = 0)
        AND filter_type = ?
        AND exam_corner.is_active
        AND start_date < Now()
        AND end_date > Now()
        AND carousel_type != 'popular'
        AND (exam_corner.locale = 'all' or exam_corner.locale = ?)
 GROUP  BY exam_corner.id,
           start_date
 ORDER  BY start_date DESC
 LIMIT  ?, ? `; /* around 100 ms on testdb */
        return database.query(sql, [ccmIds.join(), studentClass, filterType, studentLocale, offset, limit]);
    }

    // gets popular carousels for studentId's ccm id and filterType = news or careers
    static getFeedPopular(database, ccmIds, studentClass, studentLocale, filterType) {
        const sql = `SELECT title,
        exam_corner.ccm_id                                AS ccm_id,
        exam_corner.id                                    AS exam_corner_id,
        filter_type,
        start_date,
        exam_corner.class,
        exam_corner.locale,
        IF(is_live && ( live_expiry_date > Now() ), 1, 0) AS is_live,
        carousel_type,
        exam_corner.question_id,
        image_url,
        button_cta_deeplink,
        button_text,
        deeplink,
        course,
        Max(answer_id)                                    AS answer_id
 FROM   exam_corner
        LEFT JOIN class_course_mapping
               ON ccm_id = class_course_mapping.id
        LEFT JOIN questions
               ON ( exam_corner.question_id = questions.question_id )
        LEFT JOIN answers
               ON ( exam_corner.question_id = answers.question_id )
 WHERE  ( exam_corner.ccm_id IN (?)
           OR exam_corner.ccm_id IS NULL )
           AND (exam_corner.class = ? or exam_corner.class = 0)
        AND filter_type = ?
        AND exam_corner.is_active
        AND start_date < Now()
        AND end_date > Now()
        AND carousel_type = 'popular'
        AND (exam_corner.locale = 'all' or exam_corner.locale = ?)
 GROUP  BY exam_corner.id,
           start_date
 ORDER  BY start_date DESC
 LIMIT  5`; /* around 100 ms on testdb */
        return database.query(sql, [ccmIds.join(), studentClass, filterType, studentLocale]);
    }

    // gets studentId's bookmarked articles
    static getBookmarks(database, studentId, limit, offset) {
        const sql = `Select  title,
            ec.ccm_id AS ccm_id,
            ec.id     AS exam_corner_id,
            filter_type,
            start_date,
            ec.class,
            ec.locale,
            if(is_live&&(live_expiry_date > Now()),1,0) as is_live,
            carousel_type,
            ec.question_id,
            image_url,
            button_cta_deeplink,
            button_text,
            deeplink,
            course,
            Max(answer_id) as answer_id from (select exam_corner_id from student_exam_corner_bookmarked
                WHERE
                    student_id = ?
                AND is_active) AS ecb
    LEFT JOIN exam_corner as ec on ec.id = exam_corner_id
    LEFT JOIN class_course_mapping on ec.ccm_id = class_course_mapping.id
    LEFT JOIN questions on questions.question_id = ec.question_id
    LEFT JOIN answers on answers.question_id = ec.question_id
    group by  ecb.exam_corner_id, ec.start_date
    order by start_date desc limit ?,?`;/* around 100 ms on testdb */
        return database.query(sql, [studentId, offset, limit]);
    }

    // adds bookmark examCornerId for studentId
    static addBookmark(database, studentId, examCornerId) {
        const sql = `INSERT INTO
        student_exam_corner_bookmarked(student_id, exam_corner_id, is_active)
     VALUES
        (?, ?, 1) ON DUPLICATE KEY UPDATE is_active=1`; /* 30-40 ms */
        return database.query(sql, [studentId, examCornerId]);
    }

    // removes bookmark examCornerId for studentId
    static removeBookmark(database, studentId, examCornerId) {
        const sql = `UPDATE 
        student_exam_corner_bookmarked
        set is_active = 0
     WHERE
        student_id = ?
        and exam_corner_id = ?`;/* 30 ms */
        return database.query(sql, [studentId, examCornerId]);
    }

    // gets all rows with studentId and examCornerId
    static checkBookmark(database, studentId, examCornerId) {
        const sql = `SELECT * FROM
        student_exam_corner_bookmarked 
        WHERE
            student_id = ?
            and exam_corner_id = ? and is_active = 1`;/* 52 ms */
        return database.query(sql, [studentId, examCornerId]);
    }

    static examCornerArticlesForTopIconCheck(database, ccmIds, studentClass) {
        const sql = 'SELECT ccm_id, class from exam_corner where (ccm_id in (?) or ccm_id is null) and (class = ?  or class = 0) and is_active'; // around 80 ms will run max once per ccm_id per hour
        return database.query(sql, [ccmIds.join(), studentClass]);
    }

    static examCornerArticlesClassWise(database, studentClass, locale) {
        const sql = 'SELECT * from exam_corner where (class = ?  or class = 0) and locale=? and is_active=1';
        return database.query(sql, [studentClass, locale]);
    }
};
