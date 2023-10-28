const moment = require('moment');
const _ = require('lodash');
const sevenPmQuizRedis = require('../../../modules/redis/sevenPmQuiz');
const StudentContainer = require('../../../modules/containers/student');
const Faq = require('../../../modules/mysql/faq');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const sevenPmQuizData = require('../../../data/sevenPmQuiz');

function getDisplayMessage(duration, date) {
    const isSameDay = moment().add('5', 'hours').add(30, 'minutes').isSame(date, 'day');
    const now = moment().add('5', 'hours').add(30, 'minutes');
    const todayPulishTime = moment().add('5', 'hours').add(30, 'minutes');
    todayPulishTime.set({
        hour: 22,
        minute: 0,
        second: 0,
    });
    const Today7pm = moment().add('5', 'hours').add(30, 'minutes');
    Today7pm.set({
        hour: 17,
        minute: 0,
        second: 0,
    });
    if (duration === 'daily') {
        if (moment(date).isBefore(moment(sevenPmQuizData.contestStartDate))) {
            return `${moment(date).format('DD MMM\'YY')} ko Whatsapp Daily Quiz Contest aayojit nahi kiya gaya tha`;
        }
        if (moment(date).isAfter(moment(sevenPmQuizData.contestEndDate))) {
            return `${moment(date).format('DD MMM\'YY')} ko Whatsapp Daily Quiz Contest aayojit nahi kiya gaya tha`;
        }
        if (isSameDay && (now.isBefore(Today7pm))) {
            return `${moment(date).format('DD MMM\'YY')} ko hone wala Whatsapp Daily Quiz contest abhi shuru nahi hua hai. Jaldi Register karein aur Quiz Kelna na bhulein.`;
        }
        if (isSameDay && now.isAfter(Today7pm) && now.isBefore(todayPulishTime)) {
            return `${moment(date).format('DD MMM\'YY')} ko aayojit Whatsapp Daily Quiz Contest ka Result aaj raat 10:00PM par announce kiya jayega. Ab aap kal aayojit hone wale Whatsapp daily Quiz Contest ke liye Register kar sakte hain.`;
        }
        if (moment(date).isAfter(now)) {
            return `${moment(date).format('DD MMM\'YY')} ko hone wala Whatsapp Daily Quiz Contest abhi shuru nahi hua hai.
            ${moment(date).format('DD MMM\'YY')}  ko hone wala Whatsapp Daily Quiz Contest Registration ${moment(date).subtract(1, 'day').format('DD MMM\'YY')} ko 7:00PM se start honge`;
        }
        return '';
    }
    if (duration === 'weekly') {
        if (moment(date).isoWeek() < moment(sevenPmQuizData.contestStartDate).isoWeek()) {
            return 'Iss hafte Whatsapp Daily Quiz Contest aayojit nahi kiya gaya tha.';
        }
        if (moment(date).isoWeek() > moment(sevenPmQuizData.contestEndDate).isoWeek()) {
            return 'Iss hafte Whatsapp Daily Quiz Contest aayojit nahi kiya gaya tha.';
        }
        if (moment().add('5', 'hours').add(30, 'minutes').isoWeek() === moment(date).isoWeek() && (now.isoWeekday() === 1 || now.format('YYYY-MM-DD') === moment(sevenPmQuizData.contestStartDate).format('YYYY-MM-DD')) && now.isBefore(Today7pm)) {
            return 'Iss hafte ka pehla Whatsapp Daily Quiz contest abhi shuru nahi hua hai. Jaldi Register karein aur Quiz khelna na bhulein.';
        }
        if (moment().add('5', 'hours').add(30, 'minutes').isoWeek() === moment(date).isoWeek() && ((now.isoWeekday() === 1 || now.format('YYYY-MM-DD') === moment(sevenPmQuizData.contestStartDate).format('YYYY-MM-DD')) && now.isAfter(Today7pm) && now.isBefore(todayPulishTime))) {
            return 'Iss hafte ke phele Whatsapp Daily Quiz contest ka Result aaj raat 9:30PM par announce kiya jaega. Ab aap kal aayojit hone wale Whatsapp Daily Quiz Contest ke liye Register kar sakte hain.';
        }
        if (moment().add('5', 'hours').add(30, 'minutes').isoWeek() < moment(date).isoWeek()) {
            const dayBefore = moment().day('Monday').isoWeek(moment(date).isoWeek());
            dayBefore.subtract(1, 'days');
            return `Iss hafte mein hone wala Whatsapp Daily Quiz contests abhi shuru nahi hua hai. ${moment().day('Monday').isoWeek(moment(date).isoWeek()).format('DD MMM\'YY')} ko hone wala Whatsapp Daily Quiz Contest Registration ${dayBefore.format('DD MMM\'YY')} ko 7:00PM se start honge`;
        }
        return '';
    }
}
function checkIfShowWeeklyClaimReward(date) {
    const reqDate = moment(date);
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const eightThirtyToday = moment().add(5, 'hours').add(30, 'minutes').hour(22)
        .minute(0);
    if ((now.isoWeek() === reqDate.isoWeek() && now.isoWeekday() === 7 && now.isAfter(eightThirtyToday)) || (now.isoWeek() > reqDate.isoWeek())) {
        return true;
    }
    return false;
}

function shareContestWidget() {
    return {
        shareTextOnPage: sevenPmQuizData.shareOnPageText,
        whatsappShareIcon: 'whatsapp icon',
        telegramShareIcon: 'telegram icon',
        shareLink: sevenPmQuizData.shareWithFriendsLink,
        shareImage: 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png',
    };
}

async function videoResource(db, config, questionId) {
    const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources;
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getStudentRow(db, studentId, duration, date, studentData) {
    let rank;
    const weekNum = moment(date).isoWeek();
    if (duration === 'daily') {
        rank = await sevenPmQuizRedis.getDailyRank(db.redis.read, studentId, date);
    } else {
        rank = await sevenPmQuizRedis.getWeeklyRank(db.redis.read, weekNum, studentId);
    }
    if (_.isNull(rank)) {
        rank = 'NA';
    }
    let userName;
    if (studentData.student_fname !== null && studentData.student_fname.trim()) {
        if (studentData.student_lname !== null) {
            userName = `${studentData.student_fname} ${studentData.student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentData.student_fname}`;
        }
    } else if (studentData.mobile) {
        const sli = studentData.mobile.slice(0, 6);
        const phone = studentData.mobile.replace(sli, 'xxxxxx');
        userName = phone;
    }
    let reward;
    if (duration === 'daily') {
        if (rank === '1') {
            reward = '₹2500';
        } else if (rank === '2') {
            reward = '₹1500';
        } else if (rank === '3') {
            reward = '₹1000';
        }
    } else if (duration === 'weekly' && checkIfShowWeeklyClaimReward(date)) {
        if (rank === '1') {
            reward = 'mobile';
        }
    }
    const na = ((duration === 'daily') || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? 'No Prize won' : ' ';

    return {
        rank,
        image: studentData.img_url ? studentData.img_url : null,
        name: userName,
        reward: reward && ((duration === 'daily') || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? `Won ${reward}` : na,
    };
}
async function getLeaderBoard(db, duration, date) {
    const day = moment(date).format('YYYY-MM-DD');
    let leaderBoardData;
    const weekNum = moment(date).isoWeek();
    if (duration === 'daily') {
        leaderBoardData = await sevenPmQuizRedis.getDailyLeaderboard(db.redis.read, day, 0, 9);
    } else {
        leaderBoardData = await sevenPmQuizRedis.getWeeklyLeaderboard(db.redis.read, weekNum, 0, 9);
    }
    const studentIds = [];
    const studentDataPromise = [];
    for (let i = 0; i < leaderBoardData.length; i++) {
        studentIds.push(leaderBoardData[i]);
        studentDataPromise.push(StudentContainer.getById(leaderBoardData[i], db));
    }
    const studentDataArr = await Promise.all(studentDataPromise);
    const leaderboardArr = [];

    for (let i = 0; i < studentIds.length; i++) {
        let userName;
        const sli = studentDataArr[i][0].mobile.slice(0, 6);

        const phone = studentDataArr[i][0].mobile.replace(sli, 'xxxxxx');

        if (studentDataArr[i][0].student_fname !== null && studentDataArr[i][0].student_fname.trim() !== '') {
            if (studentDataArr[i][0].student_lname !== null) {
                userName = `${studentDataArr[i][0].student_fname} ${studentDataArr[i][0].student_lname}`;
                userName = userName.replace(/\n/g, ' ');
            } else {
                userName = `${studentDataArr[i][0].student_fname}`;
            }
        } else {
            userName = phone;
        }
        let reward;
        if (duration === 'daily') {
            if (i === 0) {
                reward = '₹2500';
            } else if (i === 1) {
                reward = '₹1500';
            } else if (i === 2) {
                reward = '₹1000';
            }
        } else if (duration === 'weekly') {
            if (i === 0) {
                reward = 'mobile';
            }
        }
        const na = ((duration === 'daily') || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? 'No Prize won' : ' ';
        leaderboardArr.push(
            {
                rank: i + 1,
                image: studentDataArr[i][0].img_url ? studentDataArr[i][0].img_url : null,
                name: userName,
                reward: reward && ((duration === 'daily') || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? `Won ${reward}` : na,
            },
        );
    }
    return leaderboardArr;
}

async function getFaq(db, locale) {
    const bucketNames = ['7pm_quiz_contest'];

    const versionCode = 850;
    let faqData = await Faq.getByLocale(db.mysql.read, bucketNames, locale, versionCode);
    const headers = faqData.filter((item) => item.type === 'header');
    faqData = faqData.map((item, index) => {
        if (index === 1) {
            item.is_expand = true;
        }
        return item;
    });
    faqData = faqData.filter((item) => item.type !== 'header');
    const newData = faqData.map((item) => ({
        id: item.id,
        bucket: item.bucket,
        question: item.question,
        type: item.type,
        answer: item.answer,
        is_expand: item.is_expand || false,
    }));
    const defaultFAQHeader = {
        hi: 'सबसे ज़्यादा पूछे जाने वाले सवाल',
        en: 'FAQ',
    };
    const header = bucketNames.length > 1 || bucketNames[0] === 'all' || !_.get(headers[0], 'question', false) ? defaultFAQHeader[locale] : headers[0].question;
    const widgets = [];
    widgets.push({
        header,
        widget_type: 'faq',
        widget_data: {
            faq_list: newData,
        },
    });
    return widgets;
}

module.exports = {
    getLeaderBoard,
    getFaq,
    getStudentRow,
    shareContestWidget,
    videoResource,
    getDisplayMessage,
    checkIfShowWeeklyClaimReward,
};
