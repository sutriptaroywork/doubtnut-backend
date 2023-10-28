module.exports = class UserAnswerFeedback {
    static getVideoViews(studentId, database) {
        const sql = "select * from video_view_stats where student_id = ? and is_back = 0 and source = 'android'";
        return database.query(sql, [studentId]);
    }

    static getStudentId(udid, database) {
        const sql = 'select * from students where udid =?';
        return database.query(sql, [udid]);
    }

    static getLastVideoDetails(database, studentId, page) {
        if (page === 'SRP') {
            const sql = "SELECT a.student_id, a.question_id, b.student_id AS book_student_id, b.chapter FROM video_view_stats AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.student_id = ? AND a.is_back = 0 AND a.answer_video <> 'text' AND a.source = 'android' AND b.student_id IS NOT NULL AND a.view_from IN ('SRP') ORDER BY a.view_id DESC LIMIT 1";
            return database.query(sql, [studentId]);
        } if (page === 'NON-SRP') {
            const sql = "SELECT a.student_id, a.question_id, b.student_id AS book_student_id, b.chapter FROM video_view_stats AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.student_id = ? AND a.is_back = 0 AND a.answer_video <> 'text' AND a.source = 'android' AND b.student_id IS NOT NULL AND a.view_from NOT IN ('SRP', 'SRP_PLAYLIST', 'NON_SRP_PLAYLIST', 'RECOMENDED_PLAYLIST') ORDER BY a.view_id DESC LIMIT 1";
            return database.query(sql, [studentId]);
        }
        const sql = "SELECT a.student_id, a.question_id, b.student_id AS book_student_id, b.chapter FROM video_view_stats AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.student_id = ? AND a.is_back = 0 AND a.answer_video <> 'text' AND a.source = 'android' AND b.student_id IS NOT NULL ORDER BY a.view_id DESC LIMIT 1";
        return database.query(sql, [studentId]);
    }

    static getAllViewsDetails(database, studentId, limit) {
        const sql = "SELECT question_id, answer_id FROM video_view_stats WHERE student_id = ? AND is_back = 0 AND source = 'android' ORDER BY view_id DESC LIMIT ?";
        return database.query(sql, [studentId, limit]);
    }

    static getBookNameBySid(database, studentId) {
        const sql = 'SELECT *  FROM studentid_package_mapping_new WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getLastPeopleWatchShouldWatch(database, studentId) {
        const sql = "SELECT c.*, d.id, d.course FROM (SELECT a.student_id, a.question_id, a.answer_id, b.ccm_id FROM video_view_stats AS a LEFT JOIN student_course_mapping AS b ON a.student_id = b.student_id WHERE a.student_id = ? AND a.source = 'android' AND a.view_from = 'SRP' AND b.ccm_id IS NOT NULL ORDER BY a.view_id DESC LIMIT 1) AS c LEFT JOIN class_course_mapping AS d ON c.ccm_id = d.id WHERE d.course IS NOT NULL";
        return database.query(sql, [studentId]);
    }

    static getVideoRecomendation(database, ccmId, answerId) {
        const sql = `SELECT vr.*, a.question_id FROM video_recommendation vr LEFT JOIN answers a ON vr.referred_answer_id = a.answer_id WHERE vr.ccm_id = ? AND vr.answer_id = ?`;
        return database.query(sql, [ccmId, answerId]);
    }
};
