/**
 * @Author: xesloohc
 * @Date:   2019-07-29T18:49:16+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T17:34:05+05:30
 */
module.exports = class ContentUnlock {
    static getUnlockStatus(database, student_id, content) {
        // check content type for differnt queries
        const sql = "SELECT *  FROM `gamification_milestones` WHERE `user_id`=? and ((milestone_type='BADGE' and milestone=11) OR (milestone_type='LVL' and milestone=3))";

        return database.query(sql, [student_id]);
    }
};
