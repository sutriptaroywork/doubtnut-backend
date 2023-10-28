/**
 * @Author: xesloohc
 * @Date:   2019-07-04T12:34:43+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-10-25T11:44:58+05:30
 */

const keys = require('./keys');

const oneDay = 86400;

module.exports = class Gamification {
    static addLeaderBoard(obj, client) {
        return client.zaddAsync('leaderboard', 4, JSON.stringify(obj));
    }

    static getLeaderBoardDetails(client) {
        return client.zrangeAsync('leaderboard', 0, -1, 'WITHSCORES');
    }

    static getLeaderboard(client, min, max) {
        return client.zrevrangeAsync('leaderboard', min, max, 'WITHSCORES');
    }

    static getDailyLeaderboard(client, min, max) {
        return client.zrevrangeAsync('dailyleaderboard', min, max, 'WITHSCORES');
    }

    static getRankByUserId(client, student_id) {
        return client.zrevrankAsync('leaderboard', student_id);
    }

    static getDailyRankByUserId(client, student_id) {
        return client.zrevrankAsync('dailyleaderboard', student_id);
    }

    static getScoreByUserId(client, student_id) {
        return client.zscoreAsync('leaderboard', student_id);
    }

    static getDailyScoreByUserId(client, student_id) {
        return client.zscoreAsync('dailyleaderboard', student_id);
    }

    static getUnlockCount(client) {
        return client.getAsync('pc_unlock_count');
    }

    static getUnlockImage(client) {
        return client.lrangeAsync('pc_unlock_images', 0, 2);
    }

    static getDailyLeaderBoardWithUserData(client, no_of_toppers) {
        return client.lrangeAsync('doubtnut_dailyleaderboard', 0, no_of_toppers);
    }

    static getUserMyOrderIconCount(client, student_id) {
        return client.getAsync(`myorderunlockcount_${student_id}`);
    }

    static setUserMyOrderIconCount(client, student_id) {
        return client.incrAsync(`myorderunlockcount_${student_id}`);
    }

    static delUserMyOrderIconCount(client, student_id) {
        return client.delAsync(`myorderunlockcount_${student_id}`);
    }

    static getUserData(client, studentId) {
        return client.hgetAsync(`${keys.gamificationUserData}:${studentId}`, 'USER');
    }

    static setUserData(client, studentId, data) {
        return client.multi()
            .hset(`${keys.gamificationUserData}:${studentId}`, 'USER', JSON.stringify(data))
            .expire(`${keys.gamificationUserData}:${studentId}`, oneDay)
            .execAsync();
    }
};
