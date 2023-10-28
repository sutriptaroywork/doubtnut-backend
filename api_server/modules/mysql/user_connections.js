module.exports = class UserConnections {
    static getFollowers(db, callerUserId, userId, page, size) {
        const sql = 'SELECT Case when length(e.student_fname)>1 then concat(e.student_fname,\' \',case when e.student_lname is NULL then \'\' else student_lname end) else e.student_username end as student_username,student_class,student_id,img_url,case when (select sum(1) from user_connections  where user_id =? and connection_id = student_id  and is_deleted = 0) > 0 then  1  else 0 end as is_following FROM user_connections Left join students as e on user_id = student_id WHERE connection_id = ?  and is_deleted = 0 limit ? offset ?';

        return db.query(sql, [callerUserId, userId, size, page * size]);
    }

    static getFollowingUsers(db, callerUserId, userId, page, size) {
        const sql = 'SELECT Case when length(e.student_fname)>1 then concat(e.student_fname,\' \',case when e.student_lname is NULL then \'\' else student_lname end) else e.student_username end as student_username,student_class,student_id,img_url,case when (select sum(1) from user_connections  where user_id =? and connection_id = student_id  and is_deleted = 0) > 0 then  1  else 0 end as is_following FROM user_connections Left join students as e on connection_id = student_id WHERE user_id = ? and is_deleted = 0 limit ? offset ?';
        return db.query(sql, [callerUserId, userId, size, page * size]);
    }

    static getFollower(db, connectionId, userId) {
        const sql = 'select * from user_connections where user_id = ? and connection_id =?';
        return db.query(sql, [userId, connectionId]);
    }

    static updateIsRemoved(db, connectionId, userId) {
        const sql = 'update user_connections set is_removed = 1,is_deleted = 1 where user_id = ? and connection_id =?';
        return db.query(sql, [userId, connectionId]);
    }

    static getAllFollowings(db, studentID) {
        const sql = 'SELECT connection_id FROM user_connections where user_id = ? and is_deleted = 0';
        return db.query(sql, [studentID]);
    }


    static getPopularStudents(db, callerUserId) {
        
        const sql = 'SELECT t.*,student_fname as name, img_url FROM (SELECT COUNT(*) as followers, connection_id FROM user_connections WHERE is_deleted = 0 AND connection_id IN (SELECT connection_id FROM (SELECT *,COUNT(*) as follower_gained FROM user_connections WHERE created_at > DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY) AND is_deleted = 0 AND connection_id NOT IN (SELECT connection_id FROM user_connections WHERE user_id=? AND is_deleted=0) AND connection_id!=98 GROUP BY connection_id ORDER BY follower_gained DESC LIMIT 500) AS t) GROUP BY connection_id ORDER BY RAND() LIMIT 50) AS t LEFT JOIN students ON t.connection_id = student_id';
        return db.query(sql, [callerUserId]);
    }
};
