const monthlyExpiry = 60 * 60 * 24 * 7;
const dailyExpiry = 60 * 60 * 24;

module.exports = class QuestionPuchoContest {
    static setQuestionPuchoContestLeaderboard(client, studentId, date, points) {
        client.multi()
            .zadd(`question_pucho_contest_leaderboard:${date}`, points, studentId)
            .expire(`question_pucho_contest_leaderboard:${date}`, dailyExpiry)
            .execAsync();
    }

    static getDailyRank(client, studentId, date) {
        return client.zrevrankAsync(`question_pucho_contest_leaderboard:${date}`, studentId);
    }

    static getAllTimeRank(client, studentId) {
        return client.zrevrankAsync('question_pucho_contest_lifetime_leaderboard', studentId);
    }

    static setQuestionPuchoContestLifetimeLeaderboard(client, studentId, points) {
        client.multi()
            .zadd('question_pucho_contest_lifetime_leaderboard', points, studentId)
            .expire('question_pucho_contest_lifetime_leaderboard', monthlyExpiry)
            .execAsync();
    }

    static getQuestionPuchoContestDailyLeaderboard(client, date, min, max) {
        return client.zrevrangeAsync(`question_pucho_contest_leaderboard:${date}`, min, max, 'WITHSCORES');
    }

    static getQuestionPuchoContestLifetimeLeaderboard(client, min, max) {
        return client.zrevrangeAsync('question_pucho_contest_lifetime_leaderboard', min, max, 'WITHSCORES');
    }

    static getQuestionPuchoContestDailyScore(client, date, studentId) {
        return client.zscoreAsync(`question_pucho_contest_leaderboard:${date}`, studentId);
    }

    static getQuestionPuchoContestLifetimeScore(client, studentId) {
        return client.zscoreAsync('question_pucho_contest_lifetime_leaderboard', studentId);
    }

    static setPropertyBucketValue(client, bucket, name, value, ttl) {
        return client.setAsync(`${bucket}_${name}`, value, 'Ex', ttl);
    }

    static getPropertyBucketValue(client, bucket, name) {
        return client.getAsync(`${bucket}_${name}`);
    }
};
