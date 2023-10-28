// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

module.exports = class DoubtPeCharchaMysql {
    static connect(database, studentId, isHost, roomId, questionId, subject, questionClass, locale) {
        const sql = `INSERT INTO doubt_pe_charcha (student_id, is_host, room_id, question_id, subject, class, locale)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
        return database.query(sql, [studentId, isHost, roomId, questionId, subject, questionClass, locale]);
    }

    static addMember(database, studentId, isHost, roomId) {
        const sql = `INSERT INTO doubt_pe_charcha_members (student_id, is_host, room_id)
                    VALUES (?, ?, ?)`;
        return database.query(sql, [studentId, isHost, roomId]);
    }

    static getMembers(roomId, database) {
        const sql = `SELECT s.student_id, q.question_image, q.ocr_text, q.question_id, d.is_solved, p2pm.solve_stage,
                           CONCAT(s.student_fname, ' ', s.student_lname) AS name,
                           IFNULL(s.img_url,'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/91E3CF53-0C7F-55D9-E02E-0532869D455F.webp') as image,
                           s.gcm_reg_id,
                           p2pm.is_host,
                           d.is_active,
                           d.created_at as joined_at
                    FROM doubt_pe_charcha d
                    join doubt_pe_charcha_members p2pm on d.room_id = p2pm.room_id
                             JOIN students s ON p2pm.student_id = s.student_id
                    JOIN questions_new q on d.question_id = q.question_id
                    WHERE d.room_id =? LIMIT 4`;
        return database.query(sql, [roomId]);
    }

    static getQuestionNewDetails(questionNewId, database) {
        const sql = 'select subject, class, locale from questions_new where question_id=? limit 1';
        return database.query(sql, [questionNewId]);
    }

    static feedback(rating, reason, studentId, ratingForStudent, roomId, textFeedback, database) {
        const sql = `INSERT INTO doubt_pe_charcha_feedback (rating, reason, student_id, rating_for_student, room_id, text_feedback)
                    VALUES (?, ?, ?, ?, ?, ?)`;
        return database.query(sql, [rating, reason, studentId, ratingForStudent, roomId, textFeedback]);
    }

    static totalAdded(roomId, database) {
        const sql = 'SELECT count(1) as total FROM doubt_pe_charcha_members WHERE room_id=? and is_active=1';
        return database.query(sql, [roomId]);
    }

    static isHost(roomId, studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM doubt_pe_charcha WHERE room_id=? and is_active=1 and is_host=1 and student_id=?) AS EXIST';
        return database.query(sql, [roomId, studentId]);
    }

    static getTotalHelpers(roomId, database) {
        const sql = 'SELECT count(1) as total FROM doubt_pe_charcha_members WHERE room_id=? and is_host=0';
        return database.query(sql, [roomId]);
    }

    static deactivateMember(roomId, studentId, database) {
        const sql = 'UPDATE doubt_pe_charcha_members set is_active=0 WHERE room_id=? and student_id=?';
        return database.query(sql, [roomId, studentId]);
    }

    static getRandomStudents(database) {
        // const sql = 'SELECT student_id FROM questions_new GROUP BY student_id HAVING count(1) >= 10 ORDER BY RAND() LIMIT 500';
        const sql = 'SELECT student_id FROM questions_new LIMIT 1';
        return database.query(sql);
    }

    static getStudentsData(studentIds, minVersion, database) {
        const sql = 'SELECT student_id, student_fname as name, gcm_reg_id FROM students WHERE student_id in (?) AND is_online >= ?';
        return database.query(sql, [studentIds, minVersion]);
    }

    static getHostDetails(roomId, database) {
        const sql = 'SELECT s.student_id, s.gcm_reg_id, s.mobile, d.question_id FROM doubt_pe_charcha d join students s on d.student_id=s.student_id WHERE d.is_host=1 and d.room_id=?';
        return database.query(sql, [roomId]);
    }

    static getHostDetailsNotification(roomId, activeStudents, database) {
        const sql = `SELECT s.student_id, s.gcm_reg_id, s.mobile, d.question_id FROM doubt_pe_charcha d join students s on
                     d.student_id = s.student_id WHERE d.is_host = 1 and d.room_id = ? AND s.student_id NOT IN (?)`;
        return database.query(sql, [roomId, activeStudents]);
    }

    static getHelperDetails(roomId, activeStudents, database) {
        const sql = `SELECT s.student_id, s.gcm_reg_id FROM doubt_pe_charcha_members d JOIN students s on d.student_id=s.student_id
                     WHERE d.is_host = 0 AND is_active = 1 AND d.room_id=? AND s.student_id NOT IN (?)`;
        return database.query(sql, [roomId, activeStudents]);
    }

    static getAskedDoubts(database, studentId, limit, offset) {
        const sql = `SELECT d.room_id, d.*, q.* FROM doubt_pe_charcha d
                         JOIN questions_new q ON q.question_id = d.question_id
                WHERE d.student_id = ?  ORDER BY d.id DESC LIMIT ? OFFSET ?`;
        return database.query(sql, [studentId, limit, offset]);
    }

    static getHomeAskedDoubt(database, studentId, createdAt) {
        const sql = `SELECT d.room_id, d.student_id, d.is_host, d.is_active, q.question_id, q.question_image, q.ocr_text
                    FROM doubt_pe_charcha d JOIN questions_new q ON q.question_id = d.question_id
                    WHERE d.student_id = ? AND d.is_host = 1 AND d.created_at >= ? ORDER BY d.id DESC LIMIT 1`;
        return database.query(sql, [studentId, createdAt]);
    }

    static getCommunityDoubts(database, studentClass, limit, offset) {
        const sql = `SELECT d.room_id, s.student_id, d.is_host, s.student_class, d.created_at, q.question_id, q.question_image, q.ocr_text, s.img_url
                        FROM doubt_pe_charcha d
                                 JOIN questions_new q ON q.question_id = d.question_id
                                 JOIN students s ON s.student_id = d.student_id
                        WHERE s.student_class <= ?
                        ORDER BY d.id DESC
                        LIMIT ? OFFSET ?`;
        return database.query(sql, [studentClass, limit, offset]);
    }

    static getP2PMembers(database, roomIds) {
        const sql = `SELECT d.student_id, d.is_host, s.img_url, d.room_id FROM doubt_pe_charcha_members d join students s on
        d.student_id=s.student_id WHERE d.room_id in (?) ORDER BY d.room_id DESC`;
        return database.query(sql, [roomIds]);
    }

    static getHelperData(database, roomId) {
        const sql = `SELECT d.room_id, q.question_image, q.ocr_text
                FROM doubt_pe_charcha d
                         JOIN questions_new q ON q.question_id = d.question_id
                WHERE d.room_id=? ORDER BY d.id DESC`;
        return database.query(sql, [roomId]);
    }

    static isMember(roomId, studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM doubt_pe_charcha_members WHERE room_id=? and is_active=1 and student_id=?) AS EXIST';
        return database.query(sql, [roomId, studentId]);
    }

    static isFeedbackSubmitted(roomId, studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM doubt_pe_charcha_feedback WHERE room_id= ? AND student_id= ?) AS EXIST';
        return database.query(sql, [roomId, studentId]);
    }

    static p2pGroupExistsForQuestionId(database, studentId, questionId) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM doubt_pe_charcha WHERE student_id= ? and question_id =?) AS EXIST';
        return database.query(sql, [studentId, questionId]);
    }

    static getHomeDoubts(database, studentId, isHost, limit, offset, filterQuery) {
        console.log('calling get home doubts');
        const sql = `select p2p.room_id, p2p.is_active, p2p.is_admin, p2pm.is_host, p2p.created_at, p2p.updated_at,
                    p2p.question_id, p2p.subject, p2p.class, p2p.locale, p2pm.solve_stage as is_solved, q.ocr_text,
                    q.question_image
            from doubt_pe_charcha p2p join doubt_pe_charcha_members p2pm on p2p.room_id = p2pm.room_id
                join questions_new q on p2p.question_id = q.question_id
            where p2pm.student_id = ? and p2pm.is_host= ? and p2p.locale in ('hi', 'en') ${filterQuery} order by p2p.id desc limit ? offset ?`;
        console.log(sql, studentId, isHost, limit, offset, filterQuery);
        return database.query(sql, [studentId, isHost, limit, offset]);
    }

    static getCommunityDoubtsV2(database, limit, offset, tillDate, filterQuery) {
        const sql = `select p2p.room_id, p2p.is_active, p2p.is_admin, p2p.is_host, p2p.created_at, p2p.updated_at,
                    p2p.question_id, p2p.subject, p2p.class, p2p.locale, p2p.is_solved, q.ocr_text, q.question_image
            from doubt_pe_charcha p2p join questions_new q on p2p.question_id = q.question_id where p2p.is_solved not in (2, 3) and p2p.locale in ('hi', 'en') and created_at >= ? ${filterQuery} order by p2p.id desc limit ? offset ?`;
        console.log(sql, limit, offset, tillDate, filterQuery);
        return database.query(sql, [tillDate, limit, offset]);
    }

    static getAskedDoubtFilters(database, studentId) {
        const sql = `select p2p.room_id, p2p.subject, p2p.class, p2p.locale
            from doubt_pe_charcha p2p join doubt_pe_charcha_members p2pm on p2p.room_id = p2pm.room_id
            where p2pm.student_id = ?`;
        return database.query(sql, [studentId]);
    }

    static markSolved(database, roomId, markedBy, senderId, messageId, event, solveStage) {
        const sql = `INSERT INTO doubt_pe_charcha_solved (room_id, marked_by, sender_id, message_id, event, solve_stage)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return database.query(sql, [roomId, markedBy, senderId, messageId, event, solveStage]);
    }

    static markSolvedAtParent(database, solvedStage, roomId) {
        const sql = 'UPDATE doubt_pe_charcha set is_solved=? WHERE room_id=?';
        return database.query(sql, [solvedStage, roomId]);
    }

    static updateHelperLevelDoubtStage(database, solvedStage, helperId, roomId) {
        const sql = 'update doubt_pe_charcha_members set solve_stage= ? where student_id= ? and room_id = ? and is_host=0';
        return database.query(sql, [solvedStage, helperId, roomId]);
    }

    static isMyDoubtsExists(database, studentId) {
        const sql = `select exists(select p2p.id
              from doubt_pe_charcha p2p
                       join doubt_pe_charcha_members p2pm on p2p.room_id = p2pm.room_id
                       join questions_new q on p2p.question_id = q.question_id
              where p2pm.student_id = ?) as exist`;
        return database.query(sql, [studentId]);
    }

    static setWhatsappNotifyEnabled(roomId, database) {
        const sql = 'UPDATE doubt_pe_charcha set is_whatsapp_opted=1 WHERE room_id=?';
        return database.query(sql, [roomId]);
    }
};
