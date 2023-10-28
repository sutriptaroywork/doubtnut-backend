module.exports = class Gupshup {
    static banCheck(database, student_id) {
        const sql = 'select * from image_gupshup_banned where student_id=?';
        return database.query(sql, [student_id]);
    }

    static add(database, student_id, entity_id, entity_type) {
        const sql = 'INSERT INTO `image_gupshup_banned` (`id`, `student_id`, `entity_id`, `entity_type`, `created_at`) VALUES (NULL, ?, ?, ?, CURRENT_TIMESTAMP)';
        return database.query(sql, [student_id, entity_id, entity_type]);
    }
};
