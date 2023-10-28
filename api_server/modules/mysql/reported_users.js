module.exports = class ReportedUser {
    static insertReportedUser(db, userId, reportedUserId) {
        const sql = 'INSERT INTO reported_users (user_id,reported_user_id) VALUES (?,?)';
        return db.query(sql, [userId, reportedUserId]);
    }

    static getReportedStatus(db, userId, reportedUserId) {
        const sql = 'select * from reported_users where user_id = ? and reported_user_id =?';
        return db.query(sql, [userId, reportedUserId]);
    }

    static reportCounts(db, reportedUserID) {
        // TO Check if an entry already Exists
        const sql = 'SELECT Count(*) AS cnt FROM reported_users WHERE reported_user_id = ? LIMIT 20';
        return db.query(sql, [reportedUserID]);
    }
};
