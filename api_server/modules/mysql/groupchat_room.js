module.exports = class GroupChatRoom {
    static getRooms(database, class_group, cdn_url) {
        const sql = `SELECT *,CONCAT('${cdn_url}',icon_path) as icon_url FROM groupchat_room WHERE is_active = 1 AND class = ? AND active_from < NOW()`;
        return database.query(sql, [class_group]);
    }
};
