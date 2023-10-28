// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

module.exports = class RewardsMysql {
    static getRandomPaidVideo(studentId, studentClass, database) {
        const sql = `SELECT v.id as variant_id, p.id as new_package_id
                        FROM course_details c
                                 JOIN package p ON c.assortment_id = p.assortment_id
                                 JOIN variants v ON p.id = v.package_id
                        WHERE c.class = ?
                          AND c.assortment_type = 'resource_video'
                          AND c.is_free = 0
                          AND v.display_price = 29
                          AND p.id NOT IN
                              (SELECT new_package_id FROM student_package_subscription WHERE new_package_id = v.id AND student_id = ?)
                        ORDER BY RAND()
                        LIMIT 1`;
        return database.query(sql, [studentClass, studentId]);
    }

    static createSPS(studentId, packageId, startTime, endTime, database) {
        const sql = `INSERT INTO student_package_subscription (is_active, student_id, amount, start_date,
                                                    end_date, student_package_id, doubt_ask, updated_by, meta_info,
                                                    variant_id, new_package_id)
                    VALUES (1, ?, -3.00, ?, ?, 0, -1, 'system', NULL, NULL, ?)`;
        return database.query(sql, [studentId, startTime, endTime, packageId]);
    }
};
