const _ = require('lodash');

module.exports = class Sharing {
    static getMessages(screen, mType, database) {
        const sql = 'select message from sharing_messages where screen = ? and type = ? order by id desc limit 1';
        // console.log(sql);
        return database.query(sql, [screen, mType]);
    }

    static whatsApp(database, student_id, entity_id, entity_type) {
        const sql = 'INSERT INTO `whatsapp_share_stats` (`id`, `student_id`, `entity_type`, `entity_id`, `created_at`, `updated_at`, `is_active`) VALUES (NULL, ?, ?, ?, NOW(), \'\', \'1\');';
        // console.log(sql);
        return database.query(sql, [student_id, entity_type, entity_id]);
    }
};
