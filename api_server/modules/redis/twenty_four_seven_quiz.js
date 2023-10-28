const threeMonthsExpiry = 3 * 60 * 60 * 24 * 30;

module.exports = class sevenPmQuiz {
    static getDailyRank(client, studentId, studentClass, date) {
        return client.zrevrank(`twenty_four_seven_quiz_leaderboard:${studentClass}:${date}`, studentId);
    }

    static getDailyScore(client, studentId, studentClass, date) {
        return client.zscore(`twenty_four_seven_quiz_leaderboard:${studentClass}:${date}`, studentId);
    }

    static getWeeklyRank(client, weekNumber, studentClass, studentId) {
        return client.zrevrank(`twenty_four_seven_quiz_weekly_leaderboard:${studentClass}:${weekNumber}`, studentId);
    }

    static getWeeklyScore(client, weekNumber, studentClass, studentId) {
        return client.zscore(`twenty_four_seven_quiz_weekly_leaderboard:${studentClass}:${weekNumber}`, studentId);
    }

    static getDailyLeaderboard(client, date, studentClass, min, max) {
        return client.zrevrangeAsync(`twenty_four_seven_quiz_leaderboard:${studentClass}:${date}`, min, max, 'WITHSCORES');
    }

    static getWeeklyLeaderboard(client, weekNumber, studentClass, min, max) {
        return client.zrevrangeAsync(`twenty_four_seven_quiz_weekly_leaderboard:${studentClass}:${weekNumber}`, min, max, 'WITHSCORES');
    }

    static setWeeklyLeaderboard(client, weekNumber, studentClass, studentId, points) {
        return client.multi()
            .zadd(`twenty_four_seven_quiz_weekly_leaderboard:${studentClass}:${weekNumber}`, points, studentId)
            .expire(`twenty_four_seven_quiz_weekly_leaderboard:${studentClass}:${weekNumber}`, threeMonthsExpiry)
            .exec();
    }

    static setDailyLeaderboard(client, date, studentClass, studentId, points) {
        return client.multi()
            .zadd(`twenty_four_seven_quiz_leaderboard:${studentClass}:${date}`, points, studentId)
            .expire(`twenty_four_seven_quiz_leaderboard:${studentClass}:${date}`, threeMonthsExpiry)
            .exec();
    }
};
