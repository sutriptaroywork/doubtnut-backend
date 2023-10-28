const moment = require('moment');
const _ = require('lodash');
const twentyFourSevenQuizRedis = require('../../../modules/redis/twenty_four_seven_quiz');
const StudentContainer = require('../../../modules/containers/student');
const Faq = require('../../../modules/mysql/faq');
const AnswerContainer = require('../../v13/answer/answer.container');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const twentyFourSevenQuizData = require('../../../data/twenty_four_seven_quiz');

async function getDisplayMessage(duration, date, studentClass, db) {
    const isSameDay = moment().add('5', 'hours').add(30, 'minutes').isSame(date, 'day');
    const day = moment(date).format('YYYY-MM-DD');

    const now = moment().add('5', 'hours').add(30, 'minutes');
    const weekNum = moment(date).isoWeek();
    const endOfDay = now.clone().endOf('day');
    if (duration === 'daily') {
        if (moment(date).isBefore(moment(twentyFourSevenQuizData.contestStartDate))) {
            return `${moment(date).format('DD MMM\'YY')} ko 24*7 Quiz Contest aayojit nahi kiya gaya tha`;
        }
        if (moment(date).isAfter(moment(twentyFourSevenQuizData.contestEndDate))) {
            return `${moment(date).format('DD MMM\'YY')} ko 24*7 Quiz Contest aayojit nahi kiya gaya tha`;
        }
        if (moment(date).isAfter(endOfDay)) {
            return `${moment(date).format('DD MMM\'YY')} ko abhi tak ek bhi quiz nahi kheli gai hai 8400400400 par hi bheje aur Quiz khelna start karein`;
        }
        if (isSameDay) {
            const leaderBoardData = await twentyFourSevenQuizRedis.getDailyLeaderboard(db.redis.read, day, studentClass, 0, 9);
            if (leaderBoardData.length < 8) {
                return `${moment(date).format('DD MMM\'YY')} ko abhi tak ek bhi quiz nahi kheli gai hai 8400400400 par hi bheje aur Quiz khelna start karein`;
            }
        }
        return '';
    }
    if (duration === 'weekly') {
        if (moment(date).isoWeek() < moment(twentyFourSevenQuizData.contestStartDate).isoWeek()) {
            return 'Iss hafte 7PM Quiz Contest aayojit nahi kiya gaya tha.';
        }
        if (moment(date).isoWeek() > moment(twentyFourSevenQuizData.contestEndDate).isoWeek()) {
            return 'Iss hafte 7PM Quiz Contest aayojit nahi kiya gaya tha.';
        }
        if (moment(date).isoWeek() === now.isoWeek()) {
            const leaderBoardData = await twentyFourSevenQuizRedis.getWeeklyLeaderboard(db.redis.read, weekNum, studentClass, 0, 9);
            if (leaderBoardData.length < 8) {
                return 'Iss hafte abhi tak ek bhi quiz nahi kheli gai hai 8400400400 par hi bheje aur Quiz khelna start karein';
            }
        }
        return '';
    }
}
function checkIfShowWeeklyClaimReward(date) {
    const reqDate = moment(date);
    const now = moment().add(5, 'hours').add(30, 'minutes');
    if (now.isoWeek() > reqDate.isoWeek()) {
        return true;
    }
    return false;
}
function getRewardAmount(rank, duration, date) {
    if (duration === 'weekly' && checkIfShowWeeklyClaimReward(date)) {
        if (rank === 1) {
            return 500;
        }
        if (rank === 2) {
            return 300;
        }
        if (rank === 3) {
            return 100;
        }
        return 0;
    }
    if (duration === 'daily') {
        if (rank === 1) {
            return 100;
        }
        if (rank === 2) {
            return 50;
        }
        if (rank === 3) {
            return 30;
        }
        return 0;
    }
    return 0;
}

function shareContestWidget() {
    return {
        shareTextOnPage: twentyFourSevenQuizData.shareOnPageText,
        whatsappShareIcon: 'whatsapp icon',
        telegramShareIcon: 'telegram icon',
        shareLink: twentyFourSevenQuizData.shareWithFriendsLink,
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

async function getStudentRow(db, studentId, duration, date, studentData, studentClass) {
    let questionsAsked;
    let rank;
    const weekNum = moment(date).isoWeek();
    if (duration === 'daily') {
        questionsAsked = await twentyFourSevenQuizRedis.getDailyScore(db.redis.read, studentId, studentClass, date);
        rank = await twentyFourSevenQuizRedis.getDailyRank(db.redis.read, studentId, studentClass, date);
    } else {
        rank = await twentyFourSevenQuizRedis.getWeeklyRank(db.redis.read, weekNum, studentClass, studentId);
        questionsAsked = await twentyFourSevenQuizRedis.getWeeklyScore(db.redis.read, weekNum, studentClass, studentId);
    }
    if (_.isNull(rank)) {
        rank = 'NA';
        questionsAsked = 0;
    }
    rank++;
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
    const isSameDay = moment().add(5, 'hours').add(30, 'minutes').isSame(date, 'day');

    const reward = getRewardAmount(rank, duration, date);
    const na = ((duration === 'daily' && (!isSameDay)) || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? 'No Prize won' : ' ';

    return {
        rank,
        image: studentData.img_url ? studentData.img_url : null,
        name: userName,
        reward: reward && ((duration === 'daily') || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? `Won ${reward}` : na,
        score: `Scored ${questionsAsked}`,
    };
}
async function getLeaderBoard(db, duration, studentClass, date) {
    const day = moment(date).format('YYYY-MM-DD');
    let leaderBoardData;
    const weekNum = moment(date).isoWeek();
    if (duration === 'daily') {
        leaderBoardData = await twentyFourSevenQuizRedis.getDailyLeaderboard(db.redis.read, day, studentClass, 0, 9);
    } else {
        leaderBoardData = await twentyFourSevenQuizRedis.getWeeklyLeaderboard(db.redis.read, weekNum, studentClass, 0, 9);
    }
    console.log({ leaderBoardData });
    const studentIds = [];
    const questionAsked = [];
    const studentDataPromise = [];
    for (let i = 0; i < leaderBoardData.length; i++) {
        if (i % 2 === 0) {
            studentIds.push(leaderBoardData[i]);
            studentDataPromise.push(StudentContainer.getById(leaderBoardData[i], db));
        } else {
            questionAsked.push(leaderBoardData[i]);
        }
    }
    const studentDataArr = await Promise.all(studentDataPromise);
    const leaderboardArr = [];
    console.log({ studentDataArr });
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
        const reward = getRewardAmount(i + 1, duration, date);
        const isSameDay = moment().add(5, 'hours').add(30, 'minutes').isSame(day, 'day');

        const na = ((duration === 'daily' && !isSameDay) || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? 'No Prize won' : ' ';
        leaderboardArr.push(
            {
                rank: i + 1,
                image: studentDataArr[i][0].img_url ? studentDataArr[i][0].img_url : null,
                name: userName,
                reward: reward && ((duration === 'daily' && !isSameDay) || (duration === 'weekly' && checkIfShowWeeklyClaimReward(date))) ? `Won ₹${reward}` : na,
                score: `Scored ${questionAsked[i]}.`,
            },
        );
    }
    console.log({ leaderboardArr });
    return leaderboardArr;
}

async function getFaq(db, locale) {
    const bucketNames = ['24_7_quiz_contest'];

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
    getRewardAmount,
};
