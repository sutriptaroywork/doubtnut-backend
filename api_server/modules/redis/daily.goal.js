const moment = require('moment');

module.exports = class Leaderboard {
    static getKey(id) {
        if (id === 1) {
            return `DG_WEEKLY_LEADERBOARD_${moment().add(5, 'hours').add(30, 'minutes').week()}`;
        }
        return `DG_MONTHLY_LEADERBOARD_${moment().add(5, 'hours').add(30, 'minutes').month()}`;
    }

    static getLeaderboardList(client, id, start, end) {
        return client.zrevrangeAsync(this.getKey(id), start, end, 'WITHSCORES');
    }

    static getStudentLeaderboardRank(client, id, studentId) {
        return client.zrevrankAsync(this.getKey(id), studentId);
    }

    static getStudentLeaderboardScore(client, id, studentId) {
        return client.zscoreAsync(this.getKey(id), studentId);
    }

    static setStudentLeaderboardScore(client, id, score, studentId) {
        return client.zadd(this.getKey(id), 'INCR', parseInt(score), studentId);
    }
};
