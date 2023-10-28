const QuizTfsMysql = require('../../../modules/mysql/QuizTfs');
const QuizTfsRedis = require('../../../modules/redis/QuizTfs');
const newtonNotifications = require('../../../modules/newtonNotifications');
const config = require('./config');

function dateFormatter(today) {
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    day = day.toString();
    day = day.length === 2 ? day : `0${day}`;
    month = month.toString();
    month = month.length === 2 ? month : `0${month}`;
    year = year.toString();
    const dateFormatted = `${year}-${month}-${day} 00:00:00`;
    return dateFormatted;
}
function calculateEndOfDay() {
    const now = new Date();
    const tomorrowDate = new Date();
    tomorrowDate.setDate(now.getDate() + 1);
    const starttomorrow = dateFormatter(tomorrowDate);
    const tomorrow = new Date(starttomorrow);
    const eod = Math.floor((tomorrow.valueOf() - now.valueOf()) / 1000);
    return eod + 18000;
}
module.exports = {
    firstSubmitNotification: async (db, studentId, sessionId, locale) => {
        const isFirstSubmitter = await QuizTfsMysql.isFirstSubmitter(db.mysql.read, studentId, sessionId);
        const { is_first_submit: isfirstSubmit } = isFirstSubmitter[0];
        if (isfirstSubmit) {
            const followerData = await QuizTfsMysql.getFollowers(db.mysql.read, studentId);
            const notificationData = config.firstSubmitNotification(locale);
            newtonNotifications.sendNotificationByFCM(followerData, notificationData);
        }
    },
    scratchCardNotification: async (db) => {
        const notSendRewardNotification = await QuizTfsRedis.getRewardNotificationFlag(db.redis.read);
        if (notSendRewardNotification) return;
        QuizTfsRedis.setRewardNotificationFlag(db.redis.write);
        // build notification
    },
    streakNotification: async (db, studentId, streak) => {
        const notSendStreakNotification = await QuizTfsRedis.getSteakNotificationFlag(db.redis.read, streak);
        if (notSendStreakNotification) return;
        QuizTfsRedis.setStreakNotificationFlag(db.redis.write, streak);
        // const studentData = await QuizTfsMysql.getStudentData(db.mysql.read, studentId);
        // const { student_username: username } = studentData[0]
        // build notification
    },
    leaderChangeNotification: async (db, studentId) => {
        const leaderBoardData = await QuizTfsRedis.getTestLeaderboardAll(db.redis.read);
        const currentLeader = leaderBoardData[0];
        if (currentLeader === studentId) {
            const pastLeader = await QuizTfsRedis.getPastLeader(db.redis.read);
            if (pastLeader !== currentLeader) {
                const eod = calculateEndOfDay();
                QuizTfsRedis.setPastLeader(db.redis.write, studentId, eod);
                // build notification
            }
        }
    },

};
