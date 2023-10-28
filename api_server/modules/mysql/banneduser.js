// let Utility = require('./utility');
module.exports = class Banneduser {
    static getBannedUserBystudentIdAndModule(database, studentid) {
        const sql = 'select * from banned_users where student_id= ? and is_active = 1';
        return database.query(sql, [studentid]);
    }

    static async banUser(db, studentId) {
        const bandata = {
            student_id: studentId,
            app_module: 'ALL',
            ban_type: 'Perma',
            is_active: 1,
        };
        const checkUserIsPaid = await db.query('select count(*) as count from student_package_subscription where student_id = ? and is_active = 1', studentId);
        if (checkUserIsPaid[0].count) {
            bandata.ban_type = 'Paid';
            bandata.is_active = 0;
        }
        const insertBan = 'INSERT INTO banned_users SET ?';
        return db.query(insertBan, bandata);
    }

    static async banUserByAdmin(db, studentId, adminId) {
        const bandata = {
            student_id: studentId,
            app_module: 'ALL',
            ban_type: 'Perma',
            ban_mode: 'MANUAL',
            is_active: 1,
            banned_by: adminId,
        };
        const checkUserIsPaid = await db.query('select count(*) as count from student_package_subscription where student_id = ? and is_active = 1', studentId);
        if (checkUserIsPaid[0].count) {
            bandata.ban_type = 'Paid';
            // bandata.is_active = 0;
        }
        const insertBan = 'INSERT INTO banned_users SET ?';
        return db.query(insertBan, bandata);
    }

    static getBanMode(db, studentId) {
        const sql = 'SELECT ban_mode from banned_users WHERE student_id=?';
        return db.query(sql, [studentId]);
    }

    static insertTimeOut(db, studentId, entityId) {
        const timeOutData = {
            student_id: studentId,
            entity_id: entityId,
        };
        // TODO: Add check for already inserted
        const sql = 'INSERT INTO liveclass_comment_timeouts SET ?';
        return db.query(sql, timeOutData);
    }

    static checkUserTimeOut(db, studentId, entityId) {
        const sql = 'SELECT  count(*) as count  FROM liveclass_comment_timeouts where student_id = ? and entity_id = ?';
        return db.query(sql, [studentId, entityId]);
    }
};
