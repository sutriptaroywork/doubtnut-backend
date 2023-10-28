module.exports = class CommentPinned {
    static getPinnedPostByQid(database, qid, batch) {
        const sql = 'SELECT * FROM `comment_pinned` where resource_type = "question_id" and resource_id = ? and is_active = 1 and publish_time < NOW() and unpublish_time > NOW() and batch = ?';
        return database.query(sql, [qid, batch]);
    }

    static getPinnedPostByDefault(database) {
        const sql = 'SELECT * FROM `comment_pinned` where resource_type = "default" and is_active = 1 and publish_time < NOW() and unpublish_time > NOW() limit 10';
        return database.query(sql);
    }

    static getPinnedPostByCourseId(database, assortmentIdsArray, batch) {
        if (Array.isArray(assortmentIdsArray) && !assortmentIdsArray.length) {
            return [];
        }
        const sql = 'SELECT * FROM `comment_pinned` where resource_type = "course_assortment_id" and resource_id IN (?) and is_active = 1 and publish_time < NOW() and unpublish_time > NOW() and batch = ?';
        return database.query(sql, [assortmentIdsArray, batch]);
    }

    static updateCommentId(database, pinnedId, commentId) {
        const sql = 'update set comment_id = ? where pinnedId = ?';
        return database.query(sql, [commentId, pinnedId]);
    }
};
