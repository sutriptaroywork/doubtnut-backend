module.exports = class QuizTfs {
    // get session ID
    static getSessionID(client, language, subject, studentClass) {
        return client.getAsync(`QuizTfs1:${language}:${studentClass}:${subject}:sessionId`);
    }

    static getTestLeaderboardAll(client, min, max) {
        return client.zrevrangeAsync('leaderboard:tests:quiztfs', min, max, 'WITHSCORES');
    }

    static getTestLeaderboardAllRank(client, studentID) {
        return client.zrevrankAsync('leaderboard:tests:quiztfs', studentID);
    }

    static getTestLeaderboardScore(client, studentID) {
        return client.zscoreAsync('leaderboard:tests:quiztfs', studentID);
    }

    static setLeaderboard(client, studentId, ptsReceived) {
        client.zaddAsync('leaderboard:tests:quiztfs', ptsReceived, studentId);
    }

    static getSubjectsByClassAndLanguage(client, studentClass, language) {
        return client.getAsync(`QuizTfs1:${language}:${studentClass}`);
    }

    static getLanguages(client) {
        return client.getAsync('QuizTfs1');
    }

    static getClassFromLanguage(client, language) {
        return client.getAsync(`QuizTfs1:${language}`);
    }

    static getStreakBySessionIdAndStudentId(client, sessionId, studentId) {
        return client.getAsync(`QuizTfs1:streak:${sessionId}:${studentId}`);
    }

    static setStreakForSessionIdAndStudentId(client, sessionId, studentId, streak) {
        return client.setAsync(`QuizTfs1:streak:${sessionId}:${studentId}`, JSON.stringify(streak), 'EX', 60 * 60 * 24);
    }

    static updateCurrentQuestionBySessionId(client, sessionId, questionId) {
        return client.setAsync(`QuizTfs:LiveQuestion:${sessionId}`, questionId.toString(), 'EX', 60 * 60 * 24);
    }

    static getCurrentQuestionBySessionId(client, sessionId) {
        return client.getAsync(`QuizTfs:LiveQuestion:${sessionId}`);
    }

    static getUserDataById(client, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, 'USER');
    }

    static getRewardNotificationFlag(client) {
        return client.getAsync('Quiztfs:Rewards:notificationFlag');
    }

    static setRewardNotificationFlag(client) {
        return client.setAsync('Quiztfs:Rewards:notificationFlag', '1', 'EX', 60 * 60 * 4);
    }

    static getStreakNotificationFlag(client, streak) {
        return client.getAsync(`Quiztfs:Streak:notificationFlag:${streak}`);
    }

    static setStreakNotificationFlag(client, streak) {
        return client.setAsync(`Quiztfs:Streak:notificationFlag:${streak}`, '1', 'EX', 60 * 60 * 4);
    }

    static getPastLeader(client) {
        return client.getAsync('Quiztfs:leaderboard:pastleader');
    }

    static setPastLeader(client, studentId, eod) {
        return client.setAsync('Quiztfs:leaderboard:pastleader', JSON.stringify(studentId), 'EX', eod);
    }
};
