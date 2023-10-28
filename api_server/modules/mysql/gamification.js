/**
 * @Author: xesloohc
 * @Date:   2019-06-13T17:23:30+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-11-05T19:30:15+05:30
 */
module.exports = class Gamification {
    static getGamificationUserMeta(db, student_id) {
        const sql = 'SELECT * FROM gamification_user_meta Where user_id = ?';
        return db.query(sql, [student_id]);
    }

    static saveCoinTransactions(db, data) {
        const sql = 'INSERT INTO gamification_coins_transaction SET ?';
        return db.query(sql, [data]);
    }

    static getOthersStats(db, student_id) {
        const sql = 'SELECT t1.id,t1.action,t1.stats_display_text as action_display,t1.xp,t1.is_active,t1.created_at,t1.action_page, t2.* FROM (SELECT * FROM gamification_action_config WHERE show_in_stats = 1) as t1 LEFT JOIN (SELECT count(*) as count,activity FROM gamification_activity where user_id = ? group by activity) as t2 ON t1.action = t2.activity';
        return db.query(sql, [student_id]);
    }

    static getStudentDataWithMeta(db, student_id) {
        const sql = 'SELECT * FROM (SELECT * FROM `gamification_user_meta` WHERE user_id = ?) as t1 RIGHT JOIN (SELECT * FROM `students` WHERE student_id = ?) AS t2 ON t1.user_id = t2.student_id';
        return db.query(sql, [student_id, student_id]);
    }

    // SELECT * FROM (SELECT * FROM `gamification_user_meta` WHERE user_id = 1844649) as t1 LEFT JOIN (SELECT * FROM `students` WHERE student_id = 1844649) AS t2 ON t1.user_id = t2.student_id LEFT JOIN (SELECT xp,user_id as t FROM gamification_activity WHERE user_id = 1844649 order by id DESC LIMIT 1 ) as t4 ON user_id = t4.t
    static createGamificationUserMata(db, student_id) {
        const sql = 'INSERT INTO gamification_user_meta SET ?';
        return db.query(sql, [{ user_id: student_id }]);
    }

    static getDailyPointsByUserId(db, student_id) {
        const sql = 'SELECT SUM(xp) as daily_point FROM `gamification_activity` WHERE user_id = ? AND DATE(created_at) = DATE(NOW())';
        return db.query(sql, [student_id]);
    }

    static getPointsByUserId(db, student_id) {
        const sql = 'SELECT SUM(xp) as daily_point FROM `gamification_activity` WHERE user_id = ?';
        return db.query(sql, [student_id]);
    }

    static getLevelConfig(db) {
        const sql = 'SELECT * FROM gamification_lvl_config';
        return db.query(sql);
    }

    static getLvlRange(db, lvl) {
        const minima = lvl - 3;
        const sql = "Select *, CASE WHEN lvl <= ? THEN 1 WHEN lvl > ? THEN 0 END AS 'is_achieved' From gamification_lvl_config Where lvl > ?";
        return db.query(sql, [lvl, lvl, minima]);
    }

    static getActionConfig(db) {
        const sql = 'SELECT * FROM gamification_action_config WHERE is_active = 1';
        return db.query(sql);
    }

    static updateDailyStreak(db, student_id) {
        const sql = 'UPDATE gamification_user_meta SET daily_streak = (CASE WHEN DATEDIFF(NOW(), updated_at) = 1 THEN daily_streak+1 WHEN DATEDIFF(NOW(), updated_at) = 0 THEN daily_streak ELSE 1 END) WHERE user_id = ?';
        return db.query(sql, [student_id]);
    }

    static getStudentMilestone(db, student_id) {
        const sql = 'SELECT * FROM `gamification_milestones` WHERE user_id = ?';
        return db.query(sql, [student_id]);
    }

    static getStudentMilestoneByType(db, student_id, type) {
        const sql = 'SELECT * FROM `gamification_milestones` WHERE user_id = ? AND  milestone_type = ?';
        return db.query(sql, [student_id, type]);
    }

    static getStudentByIds(db, student_ids) {
        const sql = 'SELECT * FROM students WHERE student_id IN (?)';
        return db.query(sql, [student_ids]);
    }

    static insertUserMilestones(db, milestone_data) {
        const sql = 'INSERT INTO `gamification_milestones` SET ?';
        return db.query(sql, milestone_data);
    }

    static getBadges(db) {
        const sql = 'SELECT t1.*,requirement,requirement_type FROM `gamification_badge_meta` as t1 LEFT JOIN gamification_badge_requirements on t1.id = badge_id Where t1.is_active = 1';
        return db.query(sql);
    }

    static getBadgeDataById(db, badge_id) {
        const sql = 'SELECT t1.*,requirement,requirement_type FROM `gamification_badge_meta` as t1 LEFT JOIN gamification_badge_requirements on t1.id = badge_id WHERE badge_id = ?';
        return db.query(sql, [badge_id]);
    }

    static getActivityCountByType(db, type, user_id) {
        const sql = 'SELECT sum(1) as count FROM `gamification_activity` WHERE activity = ? AND user_id = ?';
        return db.query(sql, [type, user_id]);
    }

    static getStudentCurrentAttendanceStreak(db, user_id) {
        const sql = 'SELECT streak FROM gamification_user_streak WHERE user_id = ? AND action_id=12 ORDER BY id LIMIT 1';
        return db.query(sql, [user_id]);
    }

    static getRedeemStoreForUser(db, user_id) {
        const sql = 'SELECT t1.*,CASE WHEN is_redeemed is NULL THEN 0 ELSE is_redeemed END redeem_status FROM `gamification_redeem_inventory` as t1 LEFT JOIN (SELECT * FROM gamification_redeem_transactions WHERE user_id = ?) as t2 ON t1.id = t2.item_id ORDER BY id desc';
        return db.query(sql, [user_id]);
    }

    static redeemItem(db, data) {
        const sql = 'INSERT INTO gamification_redeem_transactions SET ?';
        return db.query(sql, [data]);
    }

    static updateCoins(db, cost, student_id) {
        const sql = 'UPDATE gamification_user_meta SET coins = coins - ? WHERE user_id = ?';
        return db.query(sql, [cost, student_id]);
    }

    static updateCoinsinMeta(db, coin, student_id) {
        const sql = 'UPDATE gamification_user_meta SET coins = coins + ?,redeemable_points = redeemable_points - ?  WHERE user_id = ?';
        return db.query(sql, [coin, 2 * coin, student_id]);
    }

    static getStudentAttendanceStreak(db, student_id) {
        const sql = 'SELECT * FROM gamification_user_streak WHERE user_id = ? AND action_id = 12 LIMIT 5 ORDER BY id desc';
        return db.query(sql, [student_id]);
    }

    static getUserPoints(db, student_id) {
        const sql = 'SELECT t1.*,t2.action,t2.action_display,t2.action_page FROM (SELECT * FROM gamification_activity WHERE user_id = ? ORDER BY id desc LIMIT 25 OFFSET 0 ) as t1 LEFT JOIN gamification_action_config as t2 ON t1.activity = t2.action';
        return db.query(sql, [student_id]);
    }

    static getInventoryItemById(db, item_id) {
        const sql = 'SELECT * from gamification_redeem_inventory where id = ?';
        return db.query(sql, [item_id]);
    }

    static getMyOrderData(db, student_id) {
        const sql = 'SELECT t2.* FROM (SELECT * FROM gamification_redeem_transactions where user_id = ?) as t1 LEFT JOIN (SELECT * FROM gamification_redeem_inventory) as t2 ON t1.item_id = t2.id';
        return db.query(sql, [student_id]);
    }
};
