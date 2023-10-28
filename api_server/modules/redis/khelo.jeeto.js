const moment = require('moment');

module.exports = class Leaderboard {
    static getKey(id) {
        if (id === 1) {
            return `KJ_DAILY_LEADERBOARD_${moment().add(5, 'hours').add(30, 'minutes').date()}`;
        }
        return `KJ_WEEKLY_LEADERBOARD_${moment().add(5, 'hours').add(30, 'minutes').week()}`;
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

    static setRecentTopics(client, studentId, topic) {
        return client.multi()
            .lpush(`KJ_TOPIC_${studentId}`, topic)
            .ltrim(`KJ_TOPIC_${studentId}`, 0, 20)
            .execAsync();
    }

    static getRecentTopics(client, studentId) {
        return client.lrangeAsync(`KJ_TOPIC_${studentId}`, 0, -1);
    }
};
