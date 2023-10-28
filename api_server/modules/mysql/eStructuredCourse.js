const config = require('../../config/config');

module.exports = class EtoosStructuredCourse {
    static getStrucredCourseDetails(database) {
        const sql = 'SELECT * FROM `etoos_structured_course` ORDER BY id DESC LIMIT 1';
        return database.query(sql);
    }

    static getListingDetails(id, student_class, database) {
    // let sql = "SELECT f.subject, f.resource_reference AS id, f.structured_course_id, f.structured_course_detail_id, CONCAT('${config.staticCDN}q-thumbnail/',f.resource_reference,'.webp') AS thumbnail_url, g.ocr_text AS text, f.answer_video AS video_url FROM (SELECT d.*, e.answer_id, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',e.answer_video) AS answer_video FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM `etoos_structured_course_details` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = "+id+" AND class = "+student_class+" GROUP BY subject) AS a LEFT JOIN structured_course_resources AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = "+student_class+") AS d LEFT JOIN answers AS e ON d.resource_reference = e.question_id) AS f LEFT JOIN questions AS g ON f.resource_reference = g.question_id  ORDER BY rand()";
    // let sql = "SELECT f.subject, f.resource_reference AS id, f.structured_course_id, f.structured_course_detail_id, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS thumbnail_url, g.ocr_text AS text, f.answer_video AS video_url FROM (SELECT d.*, e.answer_id, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',e.answer_video) AS answer_video FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM `etoos_structured_course_details` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = "+id+" AND class = "+student_class+" GROUP BY subject) AS a LEFT JOIN structured_course_resources AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = "+student_class+") AS d LEFT JOIN answers AS e ON d.resource_reference = e.answer_id) AS f LEFT JOIN questions AS g ON f.resource_reference = g.question_id";
    // let sql = "SELECT f.subject, f.resource_reference AS id, f.structured_course_id, f.structured_course_detail_id, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS thumbnail_url, g.ocr_text AS text, f.answer_video AS video_url FROM (SELECT d.*, e.answer_id, '${config.staticCDN}VID-20191015-WA0057.mp4' AS answer_video FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM `etoos_structured_course_details` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = "+id+" AND class = "+student_class+" GROUP BY subject) AS a LEFT JOIN structured_course_resources AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = "+student_class+") AS d LEFT JOIN answers AS e ON d.resource_reference = e.answer_id) AS f LEFT JOIN questions AS g ON f.resource_reference = g.question_id";
    // let sql = "SELECT h.subject, h.resource_reference AS id, h.structured_course_id, h.structured_course_detail_id, CONCAT('${config.staticCDN}q-thumbnail/',h.resource_reference,'.webp') AS thumbnail_url,h.youtube_id, j.ocr_text AS text, h.answer_video AS video_url, h.answer_id FROM (SELECT f.*,g.youtube_id, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',g.answer_video) AS answer_video FROM (SELECT d.*, MAX(e.answer_id) AS answer_id FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM `etoos_structured_course_details` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = "+id+" AND class = "+student_class+" GROUP BY subject) AS a LEFT JOIN structured_course_resources AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = "+student_class+") AS d LEFT JOIN answers AS e ON d.resource_reference = e.question_id GROUP BY e.question_id) AS f LEFT JOIN answers AS g ON g.question_id = f.resource_reference AND g.answer_id = f.answer_id) AS h LEFT JOIN questions AS j ON h.resource_reference = j.question_id  ORDER BY rand()"
        const sql = `SELECT h.subject, h.resource_reference AS id, h.structured_course_id, h.structured_course_detail_id, CONCAT('${config.staticCDN}q-thumbnail/',h.resource_reference,'.webp') AS thumbnail_url,h.youtube_id, j.ocr_text AS text, h.answer_video AS video_url, h.answer_id FROM (SELECT f.*,g.youtube_id, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',g.answer_video) AS answer_video FROM (SELECT d.*, MAX(e.answer_id) AS answer_id FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM \`etoos_structured_course_details\` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = ? AND class = ? GROUP BY subject) AS a LEFT JOIN (SELECT * FROM etoos_structured_course_resources WHERE resource_type = 0) AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN etoos_structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = ?) AS d LEFT JOIN answers AS e ON d.resource_reference = e.question_id GROUP BY e.question_id) AS f LEFT JOIN answers AS g ON g.question_id = f.resource_reference AND g.answer_id = f.answer_id) AS h LEFT JOIN questions AS j ON h.resource_reference = j.question_id  ORDER BY rand()`;
        return database.query(sql, [id, student_class, student_class]);
    }

    static getStrucredCourseDetailsById(id, database) {
        const sql = 'SELECT * FROM etoos_structured_course WHERE id = ?';
        console.log('sql 1');
        console.log(sql);
        return database.query(sql, [id]);
    }

    static getTodaysTopic(id, subject, student_class, database) {
        const sql = `SELECT c.*, MAX(d.answer_id) AS answer_id,d.youtube_id, c.resource_reference AS qid, CONCAT('${config.staticCDN}q-thumbnail/',c.resource_reference,'.webp') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT a.id AS etoos_structured_course_details_id, b.expert_name, b.expert_image, b.resource_reference, a.live_at, b.q_order, a.subject FROM etoos_structured_course_details AS a LEFT JOIN etoos_structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = ? AND a.subject = ? AND b.resource_type = 0 AND b.q_order != 1 AND a.live_at >= CONCAT(CURDATE(),' 00:00:00') AND a.live_at <= CONCAT(CURDATE(),' 23:59:59') AND b.class = ?) AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY c.resource_reference ORDER BY c.q_order`;
        // let sql = "SELECT c.*, MAX(d.answer_id) AS answer_id, d.question_id AS qid, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT a.id AS structured_course_details_id, b.expert_name, b.expert_image, b.resource_reference, a.live_at, b.q_order, a.subject FROM structured_course_details AS a LEFT JOIN structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = "+id+" AND a.subject = '"+subject+"' AND b.resource_type = 0 AND a.live_at >= CONCAT(CURDATE(),' 00:00:00') AND a.live_at <= CONCAT(CURDATE(),' 23:59:59') AND b.class = "+student_class+") AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY d.question_id ORDER BY c.q_order";
        return database.query(sql, [id, subject, student_class]);
    }

    static getPdfList(id, database) {
        const sql = 'select * from etoos_structured_course_resources where structured_course_detail_id=? and (resource_type = 1 OR resource_type = 2)';
        return database.query(sql, [id]);
    }

    static getCourseIdByQuestionId(question_id, id, subject, student_class, database) {
        const sql = 'select structured_course_detail_id from  etoos_structured_course_resources where resource_reference=? and structured_course_id=? and class=?';
        return database.query(sql, [question_id, id, student_class]);
    }

    static getTodaysPdf(id, subject, student_class, database) {
    // let sql = "SELECT a.id AS structured_course_details_id, b.resource_type, b.resource_reference, a.live_at, b.q_order, a.subject FROM structured_course_details AS a LEFT JOIN structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = "+id+" AND a.subject = '"+subject+"' AND (b.resource_type = 1 OR b.resource_type = 2) AND a.live_at >= CONCAT(CURDATE(),' 00:00:00') AND a.live_at <= CONCAT(CURDATE(),' 23:59:59') AND b.class = "+student_class+" ORDER BY b.resource_type"
        const sql = 'SELECT a.id AS structured_course_details_id, b.resource_type, b.resource_reference, a.live_at, b.q_order, a.subject, b.topic FROM etoos_structured_course_details AS a LEFT JOIN etoos_structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = ? AND a.subject = ? AND (b.resource_type = 1 OR b.resource_type = 2) AND a.live_at >= CONCAT(CURDATE(),\' 00:00:00\') AND a.live_at <= CONCAT(CURDATE(),\' 23:59:59\') AND b.class = ? ORDER BY b.resource_type';
        return database.query(sql, [id, subject, student_class]);
    }

    static getCourseStructureDetails(id, subject, details_id, database) {
        const sql = `SELECT c.*, MAX(d.answer_id) AS answer_id, c.resource_reference AS qid, CONCAT('${config.staticCDN}q-thumbnail/',c.resource_reference,'.webp') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT a.id AS structured_course_details_id, b.expert_name, b.expert_image, b.resource_reference, a.live_at, b.q_order, b.resource_type, b.topic FROM etoos_structured_course_details AS a LEFT JOIN etoos_structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = ? AND a.subject = ? AND b.resource_type in (0,3) AND a.id = ?) AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY c.resource_reference ORDER BY c.q_order`;
        // let sql = "SELECT c.*, MAX(d.answer_id) AS answer_id, d.question_id AS qid, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT a.id AS structured_course_details_id, b.expert_name, b.expert_image, b.resource_reference, a.live_at, b.q_order, b.resource_type, b.topic FROM structured_course_details AS a LEFT JOIN structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = "+id+" AND a.subject = '"+subject+"' AND b.resource_type in (0,3) AND a.id = '"+details_id+"') AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY d.question_id ORDER BY c.q_order";
        console.log('sql 2');
        console.log(sql);
        return database.query(sql, [id, subject, details_id]);
    }


    static getCourseStructure(id, subject, student_class, database) {
    // let sql = "SELECT * FROM `etoos_structured_course_details` WHERE structured_course_id = "+id+" AND subject = '"+subject+"' AND class = "+student_class+"  ORDER BY date(live_at)";
        const sql = 'SELECT * FROM `etoos_structured_course_details` WHERE structured_course_id = ? AND subject = ? ORDER BY date(live_at)';
        return database.query(sql, [id, subject]);
    }

    static getCoursePdfByIds(course_id, details_id, student_class, database) {
        const sql = 'SELECT b.resource_reference, a.live_at, b.resource_type, b.topic FROM etoos_structured_course_details AS a LEFT JOIN etoos_structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = ? AND a.id = ? AND (b.resource_type = 1 OR b.resource_type = 2) ORDER BY b.resource_type';
        console.log(sql);
        return database.query(sql, [course_id, details_id]);
    }

    static getCourseDetailsByIds(course_id, details_id, database) {
        const sql = `SELECT c.*, MAX(d.answer_id) AS answer_id, d.youtube_id ,c.resource_reference AS qid, CONCAT('${config.staticCDN}q-thumbnail/',c.resource_reference,'.png') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT b.resource_reference, a.live_at, b.q_order, a.chapter, b.topic, b.player_type FROM etoos_structured_course_details AS a LEFT JOIN etoos_structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = ? AND a.id = ? AND b.resource_type = 0) AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY c.resource_reference ORDER BY c.q_order`;
        // let sql = "SELECT c.*, MAX(d.answer_id) AS answer_id, d.question_id AS qid, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS image_url, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',d.answer_video) AS video_url, d.duration FROM (SELECT b.resource_reference, a.live_at, b.q_order, a.chapter, b.topic FROM structured_course_details AS a LEFT JOIN structured_course_resources AS b ON a.id = b.structured_course_detail_id WHERE a.structured_course_id = "+course_id+" AND a.id = "+details_id+" AND b.resource_type = 0) AS c LEFT JOIN answers AS d ON c.resource_reference = d.question_id GROUP BY d.question_id ORDER BY c.q_order";
        return database.query(sql, [course_id, details_id]);
    }


    static getVideoViewStats(qid, sid, database) {
        const sql = 'SELECT * FROM video_view_stats WHERE student_id = ? AND question_id = ? limit 1';
        return database.query(sql, [sid, qid]);
    }

    static courseDataByQid(qid, database) {
        const sql = 'SELECT * FROM `etoos_structured_course_resources` WHERE resource_reference  = ?';
        return database.query(sql, [qid]);
    }

    static getAllVideosByIds(course_id, course_detail_id, database) {
        const sql = `SELECT CONVERT(a.question_id, CHAR(50)) as question_id, a.ocr_text, a.question, a.subject, MAX(b.answer_id) AS answer_id, b.duration, CONCAT('${config.staticCDN}q-thumbnail/',a.question_id,'.webp') AS thumbnail_image FROM questions as a LEFT JOIN answers as b ON a.question_id = b.question_id WHERE a.question_id in(SELECT resource_reference FROM \`etoos_structured_course_resources\` WHERE structured_course_id = ? AND structured_course_detail_id = ? AND q_order <> 1) GROUP BY a.question_id`;
        // let sql = "SELECT CONVERT(a.question_id, CHAR(50)) as question_id, a.ocr_text, a.question, a.subject, MAX(b.answer_id) AS answer_id, b.duration, CONCAT('${config.staticCDN}q-thumbnail/46659494.png') AS thumbnail_image FROM questions as a LEFT JOIN answers as b ON a.question_id = b.question_id WHERE a.question_id in(SELECT resource_reference FROM `etoos_structured_course_resources` WHERE structured_course_id = "+course_id+" AND structured_course_detail_id = "+course_detail_id+" AND q_order <> 1) GROUP BY a.question_id";
        return database.query(sql, [course_id, course_detail_id]);
    }

    static getCourseDetailsByDetailId(course_detail_id, database) {
        const sql = 'SELECT * FROM `etoos_structured_course_details` WHERE id = ?';
        return database.query(sql, [course_detail_id]);
    }

    static getMockTestDetails(test_id, student_id, database) {
        const sql = 'SELECT a.duration_in_min, a.no_of_questions, a.rule_id, b.status FROM testseries AS a LEFT JOIN (SELECT test_id, status FROM testseries_student_subscriptions WHERE test_id = ? AND student_id = ?) AS b ON a.test_id = b.test_id WHERE a.test_id = ?';
        return database.query(sql, [test_id, student_id, test_id]);
    }

    // static questionAnswerData(qid, database) {
    //   let sql = "SELECT a.answer_id, b.duration, b.question_id FROM (SELECT question_id, MAX(answer_id) AS answer_id FROM answers WHERE question_id = "+qid+") AS a LEFT JOIN answers AS b ON a.question_id = b.question_id AND a.answer_id = b.answer_id"
    //   return database.query(sql)
    // }

    static getStructuredDataByVid(qid, student_class, database) {
        const sql = 'SELECT * FROM etoos_structured_course_resources WHERE resource_reference = ? AND class = ?';
        return database.query(sql, [qid, student_class]);
    }

    static getVideoList(tag, database) {
        const sql = 'SELECT e.*, f.youtube_id, f.answer_video FROM (SELECT MAX(d.answer_id) AS answer_id, c.* FROM (SELECT a.*, b.ocr_text, b.question FROM etoos_structured_course_questions_meta AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.tag = ?) AS c LEFT JOIN answers AS d ON c.question_id = d.question_id GROUP BY c.question_id) AS e LEFT JOIN answers AS f ON e.question_id = f.question_id AND e.answer_id = f.answer_id';
        return database.query(sql, [tag]);
    }

    static getFreeClass(database, ecmId) {
        const sql = 'select id,logo as image_url, title from etoos_structured_course where ecm_id=? ORDER BY course_order';
        // const sql = 'select id,logo as image_url, title from etoos_structured_course order by id desc limit 1';
        console.log(sql);
        return database.query(sql, [ecmId]);
    }

    static getSubjectsList(database, s_c_id) {
        const sql = 'SELECT DISTINCT subject FROM etoos_structured_course_details WHERE structured_course_id = ? ORDER BY date(live_at)';
        return database.query(sql, [s_c_id]);
    }
};
