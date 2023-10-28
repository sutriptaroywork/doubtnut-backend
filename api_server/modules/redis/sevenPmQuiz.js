module.exports = class sevenPmQuiz {
    static getDailyRank(client, studentId, date) {
        return client.zscore(`seven_pm_quiz_leaderboard:${date}`, studentId);
    }

    static getWeeklyRank(client, weekNumber, studentId) {
        return client.zscore(`seven_pm_quiz_weekly_leaderboard:${weekNumber}`, studentId);
    }

    static getDailyLeaderboard(client, date, min, max) {
        return client.zrangeAsync(`seven_pm_quiz_leaderboard:${date}`, min, max);
    }

    static getWeeklyLeaderboard(client, weekNumber, min, max) {
        return client.zrangeAsync(`seven_pm_quiz_weekly_leaderboard:${weekNumber}`, min, max);
    }
};
